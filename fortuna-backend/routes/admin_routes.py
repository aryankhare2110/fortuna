from flask import Blueprint, request, jsonify
from db   import query, execute
from auth import require_auth, hash_password, is_old_enough

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.get("/dashboard")
@require_auth("admin")
def dashboard(current_user):
    """
    Platform-wide snapshot: revenue, player counts, game breakdown.
    Uses a CTE to compute bet stats and player stats in one round-trip.
    """
    summary = query(
        """
        WITH bet_stats AS (
            SELECT
                COALESCE(SUM(Amount), 0)                             AS total_wagered,
                COALESCE(SUM(Payout), 0)                             AS total_paid_out,
                COALESCE(SUM(Amount) - SUM(Payout), 0)               AS gross_revenue,
                COUNT(*)                                             AS total_bets,
                COUNT(*) FILTER (WHERE Result = 'win')               AS total_wins,
                COUNT(*) FILTER (WHERE Result = 'loss')              AS total_losses,
                COUNT(*) FILTER (WHERE Result = 'draw')              AS total_draws,
                ROUND(COALESCE(AVG(Amount), 0), 2)                   AS avg_bet_size
            FROM Bet
            WHERE Result != 'pending'
        ),
        player_stats AS (
            SELECT
                COUNT(*)                                             AS total_players,
                COUNT(*) FILTER (WHERE BlockStatus = TRUE)           AS blocked_players,
                COALESCE(SUM(WalletBalance), 0)                      AS total_wallet_funds
            FROM Player
        )
        SELECT
            bs.*,
            ps.*,
            ROUND(
                bs.gross_revenue * 100.0 / NULLIF(bs.total_wagered, 0),
            2) AS house_edge_pct
        FROM bet_stats bs, player_stats ps
        """,
        fetchone=True
    )

    game_breakdown = query(
        """
        SELECT
            g.GameName,
            COUNT(DISTINCT gs.SessionID)                AS sessions,
            COUNT(b.*)                                  AS total_bets,
            COALESCE(SUM(b.Amount), 0)                  AS total_wagered,
            COALESCE(SUM(b.Payout), 0)                  AS total_paid_out,
            COALESCE(SUM(b.Amount) - SUM(b.Payout), 0)  AS gross_revenue,
            ROUND(
                COALESCE(SUM(b.Amount) - SUM(b.Payout), 0) * 100.0
                / NULLIF(SUM(SUM(b.Amount) - SUM(b.Payout)) OVER (), 0),
            2)                                          AS revenue_share_pct
        FROM Game g
        LEFT JOIN Game_Session gs ON gs.GameID   = g.GameID
        LEFT JOIN Bet b           ON b.SessionID = gs.SessionID
        WHERE b.Result != 'pending' OR b.Result IS NULL
        GROUP BY g.GameID, g.GameName
        ORDER BY gross_revenue DESC
        """
    )

    return jsonify({
        "summary":        dict(summary),
        "game_breakdown": [dict(g) for g in game_breakdown]
    }), 200

@admin_bp.get("/revenue/daily")
@require_auth("admin")
def daily_revenue(current_user):
    """
    Daily revenue for the last N days (default 30).
    Includes a cumulative running total using a window function.
    """
    days = int(request.args.get("days", 30))

    rows = query(
        """
        SELECT
            DATE_TRUNC('day', b.BetTime)::DATE             AS game_date,
            COUNT(*)                                        AS bet_count,
            COALESCE(SUM(b.Amount), 0)                      AS daily_wagered,
            COALESCE(SUM(b.Payout), 0)                      AS daily_paid_out,
            COALESCE(SUM(b.Amount) - SUM(b.Payout), 0)      AS daily_revenue,
            SUM(COALESCE(SUM(b.Amount) - SUM(b.Payout), 0))
                OVER (ORDER BY DATE_TRUNC('day', b.BetTime)) AS cumulative_revenue
        FROM Bet b
        WHERE b.BetTime >= NOW() - (%s || ' days')::INTERVAL
          AND b.Result  != 'pending'
        GROUP BY DATE_TRUNC('day', b.BetTime)
        ORDER BY game_date
        """,
        (str(days),)
    )
    return jsonify([dict(r) for r in rows]), 200


@admin_bp.get("/revenue/by-game")
@require_auth("admin")
def revenue_by_game(current_user):
    """Detailed per-game revenue with average bet size and largest payout."""
    rows = query(
        """
        SELECT
            g.GameName,
            COUNT(DISTINCT gs.SessionID)                AS sessions,
            COUNT(b.*)                                  AS total_bets,
            COALESCE(SUM(b.Amount), 0)                  AS total_wagered,
            COALESCE(SUM(b.Payout), 0)                  AS total_paid_out,
            COALESCE(SUM(b.Amount) - SUM(b.Payout), 0)  AS gross_revenue,
            ROUND(COALESCE(AVG(b.Amount), 0), 2)         AS avg_bet_size,
            COALESCE(MAX(b.Payout), 0)                   AS largest_payout
        FROM Game g
        JOIN Game_Session gs ON gs.GameID   = g.GameID
        JOIN Bet b           ON b.SessionID = gs.SessionID
        WHERE b.Result != 'pending'
        GROUP BY g.GameID, g.GameName
        ORDER BY gross_revenue DESC
        """
    )
    return jsonify([dict(r) for r in rows]), 200

@admin_bp.get("/players")
@require_auth("admin")
def list_players(current_user):
    """
    Full player list with last activity and most recent ban reason.
    Uses LEFT JOIN LATERAL to fetch the latest ban per player efficiently.
    """
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    offset   = (page - 1) * per_page

    players = query(
        """
        SELECT
            p.PlayerID, p.Username, p.Email, p.FirstName, p.LastName,
            p.DOB, p.WalletBalance, p.TotalWinnings,
            p.RewardPoints, p.GamesPlayed, p.BlockStatus,
            last_bet.last_active,
            ban.reason AS ban_reason
        FROM Player p
        LEFT JOIN (
            SELECT PlayerID, MAX(BetTime) AS last_active
            FROM Bet
            GROUP BY PlayerID
        ) last_bet ON last_bet.PlayerID = p.PlayerID
        LEFT JOIN LATERAL (
            SELECT Reason
            FROM Ban_Log
            WHERE PlayerID = p.PlayerID AND Action = 'ban'
            ORDER BY ActionTime DESC
            LIMIT 1
        ) ban ON TRUE
        ORDER BY p.PlayerID
        LIMIT %s OFFSET %s
        """,
        (per_page, offset)
    )
    return jsonify([dict(p) for p in players]), 200


@admin_bp.get("/players/<int:player_id>")
@require_auth("admin")
def get_player(current_user, player_id):
    """Full profile for a single player including leaderboard ranks."""
    player = query(
        """
        SELECT
            p.PlayerID, p.Username, p.FirstName, p.LastName,
            p.Email, p.DOB, p.WalletBalance, p.BlockStatus,
            p.TotalWinnings, p.RewardPoints, p.GamesPlayed,
            MAX(CASE WHEN l.MetricType = 'total_winnings' THEN l.Rank END) AS winnings_rank,
            MAX(CASE WHEN l.MetricType = 'net_profit'     THEN l.Rank END) AS profit_rank,
            MAX(CASE WHEN l.MetricType = 'games_played'   THEN l.Rank END) AS games_rank
        FROM Player p
        LEFT JOIN Leaderboard l ON l.PlayerID = p.PlayerID
        WHERE p.PlayerID = %s
        GROUP BY p.PlayerID
        """,
        (player_id,),
        fetchone=True
    )
    if not player:
        return jsonify({"error": "Player not found"}), 404
    return jsonify(dict(player)), 200


@admin_bp.post("/players")
@require_auth("admin")
def create_player(current_user):
    """Admin manually creates a player account."""
    data = request.get_json() or {}

    required = ["username", "first_name", "dob", "email", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    if not is_old_enough(data["dob"]):
        return jsonify({"error": "Player must be at least 18 years old"}), 400

    existing = query(
        "SELECT PlayerID FROM Player WHERE Email = %s OR Username = %s",
        (data["email"], data["username"]),
        fetchone=True
    )
    if existing:
        return jsonify({"error": "Email or username already in use"}), 409

    player = execute(
        """
        INSERT INTO Player (Username, FirstName, LastName, DOB, Email, PasswordHashed)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING PlayerID, Username, Email
        """,
        (
            data["username"],
            data["first_name"],
            data.get("last_name"),
            data["dob"],
            data["email"],
            hash_password(data["password"]),
        ),
        returning=True
    )
    return jsonify(dict(player)), 201


@admin_bp.post("/players/<int:player_id>/ban")
@require_auth("admin")
def ban_player(current_user, player_id):
    """
    Ban or unban a player via the admin dashboard.
    """
    player = query(
        "SELECT Username, BlockStatus FROM Player WHERE PlayerID = %s",
        (player_id,),
        fetchone=True
    )
    if not player:
        return jsonify({"error": "Player not found"}), 404

    new_status = not player["blockstatus"]
    execute("UPDATE Player SET BlockStatus = %s WHERE PlayerID = %s", (new_status, player_id))

    action = "ban" if new_status else "unban"
    return jsonify({
        "message": f"Player '{player['username']}' {action}ned"
    }), 200


@admin_bp.get("/players/top-spenders")
@require_auth("admin")
def top_spenders(current_user):
    """Top 5 highest-spending players — VIP candidates."""
    rows = query(
        """
        SELECT
            RANK() OVER (ORDER BY SUM(b.Amount) DESC) AS spend_rank,
            p.PlayerID, p.Username, p.Email,
            COUNT(b.*)                                AS total_bets,
            COALESCE(SUM(b.Amount), 0)                AS total_spent,
            COALESCE(SUM(b.Payout), 0)                AS total_won,
            COALESCE(SUM(b.Amount) - SUM(b.Payout),0) AS net_spend,
            p.RewardPoints,
            p.WalletBalance
        FROM Player p
        JOIN Bet b ON b.PlayerID = p.PlayerID
        WHERE p.BlockStatus = FALSE
        GROUP BY p.PlayerID, p.Username, p.Email, p.RewardPoints, p.WalletBalance
        ORDER BY total_spent DESC
        LIMIT 5
        """
    )
    return jsonify([dict(r) for r in rows]), 200

@admin_bp.get("/dealers")
@require_auth("admin")
def list_dealers(current_user):
    dealers = query(
        """
        SELECT
            DealerID, FirstName, LastName, Email,
            IsAvailable, RoundsConducted, TotalBetsHandled, TotalPayouts
        FROM Dealer
        ORDER BY DealerID
        """
    )
    return jsonify([dict(d) for d in dealers]), 200


@admin_bp.post("/dealers")
@require_auth("admin")
def create_dealer(current_user):
    """Only admins can create dealer accounts — no public registration for dealers."""
    data = request.get_json() or {}

    required = ["first_name", "email", "password"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    existing = query(
        "SELECT DealerID FROM Dealer WHERE Email = %s",
        (data["email"],),
        fetchone=True
    )
    if existing:
        return jsonify({"error": "Email already in use"}), 409

    dealer = execute(
        """
        INSERT INTO Dealer (FirstName, LastName, Email, PasswordHashed)
        VALUES (%s, %s, %s, %s)
        RETURNING DealerID, FirstName, Email
        """,
        (
            data["first_name"],
            data.get("last_name"),
            data["email"],
            hash_password(data["password"]),
        ),
        returning=True
    )
    return jsonify(dict(dealer)), 201


@admin_bp.delete("/dealers/<int:dealer_id>")
@require_auth("admin")
def delete_dealer(current_user, dealer_id):
    dealer = query(
        "SELECT FirstName FROM Dealer WHERE DealerID = %s",
        (dealer_id,),
        fetchone=True
    )
    if not dealer:
        return jsonify({"error": "Dealer not found"}), 404

    active = query(
        "SELECT SessionID FROM Game_Session WHERE DealerID = %s AND EndTime IS NULL",
        (dealer_id,),
        fetchone=True
    )
    if active:
        return jsonify({"error": "Cannot delete dealer with an active session"}), 400

    execute("DELETE FROM Dealer WHERE DealerID = %s", (dealer_id,))
    return jsonify({"message": f"Dealer '{dealer['firstname']}' deleted"}), 200

@admin_bp.get("/games")
@require_auth("admin")
def list_games(current_user):
    """All games including inactive ones (dealers only see active games)."""
    games = query(
        "SELECT GameID, GameName, MinBet, MaxBet, IsActive FROM Game ORDER BY GameID"
    )
    return jsonify([dict(g) for g in games]), 200


@admin_bp.patch("/games/<int:game_id>")
@require_auth("admin")
def update_game(current_user, game_id):
    """
    Update game settings (MinBet, MaxBet, IsActive).
    Every change is logged to Game_Config_Log with a JSONB diff.
    """
    data    = request.get_json() or {}
    allowed = {"min_bet": "MinBet", "max_bet": "MaxBet", "is_active": "IsActive"}
    updates = {allowed[k]: v for k, v in data.items() if k in allowed}

    if not updates:
        return jsonify({"error": "Nothing to update"}), 400

    game = query(
        "SELECT GameID, GameName, MinBet, MaxBet, IsActive FROM Game WHERE GameID = %s",
        (game_id,),
        fetchone=True
    )
    if not game:
        return jsonify({"error": "Game not found"}), 404

    new_min = float(updates.get("MinBet", game["minbet"]))
    new_max = float(updates.get("MaxBet", game["maxbet"]))
    if new_min <= 0 or new_max <= new_min:
        return jsonify({"error": "MaxBet must be greater than MinBet, and MinBet must be > 0"}), 400

    set_clause = ", ".join(f"{col} = %s" for col in updates)
    execute(
        f"UPDATE Game SET {set_clause} WHERE GameID = %s",
        (*updates.values(), game_id)
    )

    import json
    changes = {
        col: {"old": str(game[col.lower()]), "new": str(val)}
        for col, val in updates.items()
    }
    execute(
        """
        INSERT INTO Game_Config_Log (GameID, AdminID, ChangeDetails)
        VALUES (%s, %s, %s)
        """,
        (game_id, current_user["id"], json.dumps(changes))
    )

    return jsonify({"message": f"Game '{game['gamename']}' updated", "changes": changes}), 200


@admin_bp.get("/games/<int:game_id>/config-log")
@require_auth("admin")
def game_config_log(current_user, game_id):
    """Full audit trail of changes made to a game's configuration."""
    logs = query(
        """
        SELECT
            gcl.ConfigTimestamp,
            g.GameName,
            a.FirstName || ' ' || COALESCE(a.LastName, '') AS changed_by,
            gcl.ChangeDetails
        FROM Game_Config_Log gcl
        JOIN Game  g ON g.GameID  = gcl.GameID
        JOIN Admin a ON a.AdminID = gcl.AdminID
        WHERE gcl.GameID = %s
        ORDER BY gcl.ConfigTimestamp DESC
        """,
        (game_id,)
    )
    return jsonify([dict(l) for l in logs]), 200

@admin_bp.post("/leaderboard/refresh")
@require_auth("admin")
def refresh_leaderboard(current_user):
    """Manually trigger a leaderboard recompute."""
    execute("SELECT refresh_leaderboard()")
    return jsonify({"message": "Leaderboard refreshed"}), 200


@admin_bp.get("/leaderboard")
@require_auth("admin")
def full_leaderboard(current_user):
    """Full leaderboard for all three metrics — not capped at 10 like the public endpoint."""
    metric = request.args.get("metric", "total_winnings")
    valid  = ("total_winnings", "net_profit", "games_played")

    if metric not in valid:
        return jsonify({"error": f"metric must be one of {valid}"}), 400

    rows = query(
        """
        SELECT
            l.Rank,
            p.PlayerID, p.Username, p.Email,
            p.TotalWinnings, p.GamesPlayed, p.RewardPoints,
            p.BlockStatus
        FROM Leaderboard l
        JOIN Player p ON p.PlayerID = l.PlayerID
        WHERE l.MetricType = %s
        ORDER BY l.Rank
        """,
        (metric,)
    )
    return jsonify([dict(r) for r in rows]), 200