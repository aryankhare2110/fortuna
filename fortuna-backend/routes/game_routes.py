from flask import Blueprint, request, jsonify
from db   import query, execute
from auth import require_auth

game_bp = Blueprint("game", __name__, url_prefix="/api/game")

@game_bp.get("/list")
def list_games():
    """Public endpoint — no auth needed to browse available games."""
    games = query(
        """
        SELECT GameID, GameName, MinBet, MaxBet, IsActive
        FROM Game
        WHERE IsActive = TRUE
        ORDER BY GameName
        """
    )
    return jsonify([dict(g) for g in games]), 200


@game_bp.get("/<int:game_id>")
def get_game(game_id):
    game = query(
        "SELECT GameID, GameName, MinBet, MaxBet, IsActive FROM Game WHERE GameID = %s",
        (game_id,),
        fetchone=True
    )
    if not game:
        return jsonify({"error": "Game not found"}), 404
    return jsonify(dict(game)), 200

@game_bp.post("/session/start")
@require_auth("dealer", "player")
def start_session(current_user):
    """Dealer or Player starts a new game session."""
    data    = request.get_json() or {}
    game_id = data.get("game_id")

    if not game_id:
        return jsonify({"error": "game_id is required"}), 400

    game = query(
        "SELECT GameID FROM Game WHERE GameID = %s AND IsActive = TRUE",
        (game_id,),
        fetchone=True
    )
    if not game:
        return jsonify({"error": "Game not found or inactive"}), 404

    dealer_id = current_user["id"]
    if current_user["role"] == "player":
        dealer = query("SELECT DealerID FROM Dealer WHERE IsAvailable = TRUE ORDER BY RANDOM() LIMIT 1", fetchone=True)
        dealer_id = dealer["dealerid"] if dealer else 1

    session = execute(
        """
        INSERT INTO Game_Session (GameID, DealerID)
        VALUES (%s, %s)
        RETURNING SessionID, GameID, DealerID, StartTime
        """,
        (game_id, dealer_id),
        returning=True
    )
    return jsonify(dict(session)), 201


@game_bp.patch("/session/<int:session_id>/end")
@require_auth("dealer", "player")
def end_session(current_user, session_id):
    """Ends a session and sets the outcome."""
    data    = request.get_json() or {}
    outcome = data.get("outcome")

    valid_outcomes = ("player_win", "dealer_win", "draw", "cancelled")
    if outcome not in valid_outcomes:
        return jsonify({"error": f"outcome must be one of {valid_outcomes}"}), 400

    if current_user["role"] == "dealer":
        session = query(
            "SELECT SessionID, EndTime FROM Game_Session WHERE SessionID = %s AND DealerID = %s",
            (session_id, current_user["id"]),
            fetchone=True
        )
    else:
        session = query(
            "SELECT SessionID, EndTime FROM Game_Session WHERE SessionID = %s",
            (session_id,),
            fetchone=True
        )

    if not session:
        return jsonify({"error": "Session not found or not yours"}), 404
    if session["endtime"] is not None:
        return jsonify({"error": "Session already ended"}), 400

    result = execute(
        """
        UPDATE Game_Session
        SET EndTime = NOW(), Outcome = %s
        WHERE SessionID = %s
        RETURNING SessionID, EndTime, Outcome
        """,
        (outcome, session_id),
        returning=True
    )

    execute("SELECT refresh_leaderboard()")

    return jsonify(dict(result)), 200


@game_bp.get("/session/<int:session_id>")
@require_auth("player", "dealer", "admin")
def get_session(current_user, session_id):
    session = query(
        """
        SELECT gs.SessionID, g.GameName, gs.StartTime, gs.EndTime,
               gs.Outcome, gs.DealerID
        FROM Game_Session gs
        JOIN Game g ON g.GameID = gs.GameID
        WHERE gs.SessionID = %s
        """,
        (session_id,),
        fetchone=True
    )
    if not session:
        return jsonify({"error": "Session not found"}), 404
    return jsonify(dict(session)), 200

@game_bp.post("/bet")
@require_auth("player")
def place_bet(current_user):
    """
    Player places a bet.
    React sends: session_id, amount, result, payout
    (React has already resolved the game outcome client-side)

    Triggers that fire automatically:
      - trg_block_check   → rejects if player is blocked
      - trg_bet_limits    → rejects if amount outside game min/max
      - trg_wallet_bet_debit → deducts amount from wallet on INSERT
      - trg_wallet_bet_credit → credits payout if result = 'win' on UPDATE
      - trg_update_player_stats → updates TotalWinnings, GamesPlayed, RewardPoints
      - trg_update_dealer_stats → updates dealer TotalBetsHandled, TotalPayouts
    """
    data       = request.get_json() or {}
    session_id = data.get("session_id")
    amount     = data.get("amount")
    result     = data.get("result") 
    payout     = data.get("payout", 0.0)

    # Validate inputs
    if not all([session_id, amount, result]):
        return jsonify({"error": "session_id, amount, and result are required"}), 400

    valid_results = ("win", "loss", "draw")
    if result not in valid_results:
        return jsonify({"error": f"result must be one of {valid_results}"}), 400

    if float(amount) <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    if result == "win" and float(payout) <= 0:
        return jsonify({"error": "Payout must be > 0 for a win"}), 400

    session = query(
        "SELECT SessionID, EndTime FROM Game_Session WHERE SessionID = %s",
        (session_id,),
        fetchone=True
    )
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session["endtime"] is not None:
        return jsonify({"error": "Cannot bet on a closed session"}), 400

    # Strong manual wallet check
    player = query("SELECT WalletBalance FROM Player WHERE PlayerID = %s", (current_user["id"],), fetchone=True)
    if not player or float(player["walletbalance"]) < float(amount):
        return jsonify({"error": "Insufficient wallet balance"}), 400

    try:
        bet = execute(
            """
            INSERT INTO Bet (PlayerID, SessionID, Amount, Result, Payout)
            VALUES (%s, %s, %s, 'pending', 0)
            RETURNING BetTime, PlayerID, SessionID
            """,
            (current_user["id"], session_id, float(amount)),
            returning=True
        )

        execute(
            """
            UPDATE Bet
            SET Result = %s, Payout = %s
            WHERE BetTime = %s AND PlayerID = %s AND SessionID = %s
            """,
            (result, float(payout),
             bet["bettime"], bet["playerid"], bet["sessionid"])
        )

        # Force a transaction log for the frontend dashboard
        if float(amount) > 0:
            execute(
                """
                INSERT INTO Wallet_Transaction (PlayerID, Type, Amount, BalanceAfter, PointTransaction)
                VALUES (%s, 'bet_debit', %s, (SELECT WalletBalance FROM Player WHERE PlayerID = %s), 0)
                """,
                (current_user["id"], float(amount), current_user["id"])
            )
        if float(payout) > 0:
            execute(
                """
                INSERT INTO Wallet_Transaction (PlayerID, Type, Amount, BalanceAfter, PointTransaction)
                VALUES (%s, 'bet_credit', %s, (SELECT WalletBalance FROM Player WHERE PlayerID = %s), 0)
                """,
                (current_user["id"], float(payout), current_user["id"])
            )

    except Exception as e:
        error_msg = str(e)
        if "blocked" in error_msg.lower():
            return jsonify({"error": "Your account is suspended"}), 403
        if "outside game limits" in error_msg.lower():
            clean_msg = error_msg.split("CONTEXT:")[0].strip()
            return jsonify({"error": clean_msg}), 400
        if "wallet" in error_msg.lower() or "balance" in error_msg.lower():
            return jsonify({"error": "Insufficient wallet balance"}), 400
        return jsonify({"error": "Could not place bet"}), 500

    # Return updated wallet balance
    player = query(
        "SELECT WalletBalance, RewardPoints FROM Player WHERE PlayerID = %s",
        (current_user["id"],),
        fetchone=True
    )

    return jsonify({
        "message":        "Bet recorded",
        "result":         result,
        "payout":         float(payout),
        "wallet_balance": float(player["walletbalance"]),
        "reward_points":  player["rewardpoints"]
    }), 201


@game_bp.get("/leaderboard")
def leaderboard():
    """Public endpoint. metric: total_winnings | net_profit | games_played"""
    metric = request.args.get("metric", "total_winnings")
    valid  = ("total_winnings", "net_profit", "games_played")

    if metric not in valid:
        return jsonify({"error": f"metric must be one of {valid}"}), 400

    rows = query(
        """
        SELECT
            l.Rank,
            p.Username,
            p.FirstName,
            p.TotalWinnings,
            p.GamesPlayed,
            p.RewardPoints
        FROM Leaderboard l
        JOIN Player p ON p.PlayerID = l.PlayerID
        WHERE l.MetricType = %s
          AND p.BlockStatus = FALSE
        ORDER BY l.Rank
        LIMIT 10
        """,
        (metric,)
    )
    return jsonify([dict(r) for r in rows]), 200