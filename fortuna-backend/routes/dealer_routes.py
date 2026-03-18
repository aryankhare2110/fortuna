from flask import Blueprint, request, jsonify
from db   import query, execute
from auth import require_auth

dealer_bp = Blueprint("dealer", __name__, url_prefix="/api/dealer")


@dealer_bp.get("/dashboard")
@require_auth("dealer")
def dashboard(current_user):
    """Summary stats + recent sessions for this dealer."""
    summary = query(
        """
        SELECT
            d.DealerID, d.FirstName, d.LastName, d.IsAvailable,
            d.RoundsConducted, d.TotalBetsHandled, d.TotalPayouts
        FROM Dealer d
        WHERE d.DealerID = %s
        """,
        (current_user["id"],),
        fetchone=True
    )

    recent_sessions = query(
        """
        SELECT
            gs.SessionID, g.GameName,
            gs.StartTime, gs.EndTime, gs.Outcome,
            EXTRACT(EPOCH FROM (gs.EndTime - gs.StartTime)) / 60  AS duration_mins,
            COUNT(b.*)                                             AS bet_count,
            COALESCE(SUM(b.Amount), 0)                             AS total_wagered,
            COALESCE(SUM(b.Payout), 0)                             AS total_paid,
            COALESCE(SUM(b.Amount) - SUM(b.Payout), 0)             AS house_profit
        FROM Game_Session gs
        JOIN Game g         ON g.GameID     = gs.GameID
        LEFT JOIN Bet b     ON b.SessionID  = gs.SessionID
        WHERE gs.DealerID = %s
        GROUP BY gs.SessionID, g.GameName, gs.StartTime, gs.EndTime, gs.Outcome
        ORDER BY gs.StartTime DESC
        LIMIT 10
        """,
        (current_user["id"],)
    )

    return jsonify({
        "summary":         dict(summary),
        "recent_sessions": [dict(s) for s in recent_sessions]
    }), 200


@dealer_bp.get("/sessions")
@require_auth("dealer")
def all_sessions(current_user):
    """Full session history for this dealer with pagination."""
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    offset   = (page - 1) * per_page

    sessions = query(
        """
        SELECT
            gs.SessionID, g.GameName,
            gs.StartTime, gs.EndTime, gs.Outcome,
            COUNT(b.*)                                  AS bet_count,
            COALESCE(SUM(b.Amount), 0)                  AS total_wagered,
            COALESCE(SUM(b.Amount) - SUM(b.Payout), 0)  AS house_profit
        FROM Game_Session gs
        JOIN Game g     ON g.GameID    = gs.GameID
        LEFT JOIN Bet b ON b.SessionID = gs.SessionID
        WHERE gs.DealerID = %s
        GROUP BY gs.SessionID, g.GameName, gs.StartTime, gs.EndTime, gs.Outcome
        ORDER BY gs.StartTime DESC
        LIMIT %s OFFSET %s
        """,
        (current_user["id"], per_page, offset)
    )
    return jsonify([dict(s) for s in sessions]), 200


@dealer_bp.get("/sessions/active")
@require_auth("dealer")
def active_session(current_user):
    """Returns the dealer's currently open session, if any."""
    session = query(
        """
        SELECT gs.SessionID, g.GameName, gs.StartTime
        FROM Game_Session gs
        JOIN Game g ON g.GameID = gs.GameID
        WHERE gs.DealerID = %s AND gs.EndTime IS NULL
        ORDER BY gs.StartTime DESC
        LIMIT 1
        """,
        (current_user["id"],),
        fetchone=True
    )
    if not session:
        return jsonify({"active_session": None}), 200
    return jsonify(dict(session)), 200


@dealer_bp.patch("/availability")
@require_auth("dealer")
def toggle_availability(current_user):
    data      = request.get_json() or {}
    available = data.get("is_available")

    if available is None:
        return jsonify({"error": "is_available (bool) is required"}), 400

    result = execute(
        """
        UPDATE Dealer SET IsAvailable = %s
        WHERE DealerID = %s
        RETURNING IsAvailable
        """,
        (bool(available), current_user["id"]),
        returning=True
    )
    return jsonify({"is_available": result["isavailable"]}), 200


@dealer_bp.post("/ban/<int:player_id>")
@require_auth("dealer")
def ban_player(current_user, player_id):
    data   = request.get_json() or {}
    reason = data.get("reason", "")

    if not reason.strip():
        return jsonify({"error": "A reason is required to ban a player"}), 400

    player = query(
        "SELECT PlayerID, BlockStatus, Username FROM Player WHERE PlayerID = %s",
        (player_id,),
        fetchone=True
    )
    if not player:
        return jsonify({"error": "Player not found"}), 404
    if player["blockstatus"]:
        return jsonify({"error": f"{player['username']} is already banned"}), 400

    execute(
        """
        INSERT INTO Ban_Log (DealerID, PlayerID, Action, Reason)
        VALUES (%s, %s, 'ban', %s)
        """,
        (current_user["id"], player_id, reason)
    )

    execute(
        "UPDATE Player SET BlockStatus = TRUE WHERE PlayerID = %s",
        (player_id,)
    )

    return jsonify({
        "message": f"Player '{player['username']}' has been banned",
        "reason":  reason
    }), 200


@dealer_bp.post("/unban/<int:player_id>")
@require_auth("dealer")
def unban_player(current_user, player_id):
    player = query(
        "SELECT PlayerID, BlockStatus, Username FROM Player WHERE PlayerID = %s",
        (player_id,),
        fetchone=True
    )
    if not player:
        return jsonify({"error": "Player not found"}), 404
    if not player["blockstatus"]:
        return jsonify({"error": f"{player['username']} is not currently banned"}), 400

    execute(
        """
        INSERT INTO Ban_Log (DealerID, PlayerID, Action, Reason)
        VALUES (%s, %s, 'unban', 'Player reinstated')
        """,
        (current_user["id"], player_id)
    )

    execute(
        "UPDATE Player SET BlockStatus = FALSE WHERE PlayerID = %s",
        (player_id,)
    )

    return jsonify({
        "message": f"Player '{player['username']}' has been unbanned"
    }), 200


@dealer_bp.get("/ban-log")
@require_auth("dealer")
def ban_log(current_user):
    """All ban/unban actions taken by this dealer."""
    logs = query(
        """
        SELECT
            bl.ActionTime, bl.Action, bl.Reason,
            p.PlayerID, p.Username, p.Email
        FROM Ban_Log bl
        JOIN Player p ON p.PlayerID = bl.PlayerID
        WHERE bl.DealerID = %s
        ORDER BY bl.ActionTime DESC
        """,
        (current_user["id"],)
    )
    return jsonify([dict(l) for l in logs]), 200


@dealer_bp.get("/flagged-players")
@require_auth("dealer")
def flagged_players(current_user):
    """
    Players who show highly suspicious anomalies:
    - More than 10 bets in a single session (Bot/scriptting)
    - Wagered more than ₹2,500 in a session (High risk)
    - Payouts exceeding ₹5,000 in a session (Card counting/Exploits)
    """
    flagged = query(
        """
        SELECT
            p.PlayerID, p.Username, p.Email, p.BlockStatus,
            suspicious.SessionID,
            suspicious.bet_count,
            suspicious.total_wagered,
            suspicious.total_payout,
            bl.ActionTime AS ban_time,
            bl.Reason     AS ban_reason
        FROM (
            SELECT
                b.PlayerID,
                b.SessionID,
                COUNT(*)      AS bet_count,
                SUM(b.Amount) AS total_wagered,
                SUM(b.Payout) AS total_payout
            FROM Bet b
            JOIN Game_Session gs ON gs.SessionID = b.SessionID
            WHERE gs.DealerID = %s
            GROUP BY b.PlayerID, b.SessionID
            HAVING COUNT(*) > 10 OR SUM(b.Amount) > 2500 OR SUM(b.Payout) > 5000
        ) suspicious
        JOIN Player p ON p.PlayerID = suspicious.PlayerID
        LEFT JOIN LATERAL (
            SELECT ActionTime, Reason
            FROM Ban_Log
            WHERE PlayerID = p.PlayerID
              AND DealerID  = %s
              AND Action    = 'ban'
            ORDER BY ActionTime DESC
            LIMIT 1
        ) bl ON TRUE
        ORDER BY suspicious.total_wagered DESC
        """,
        (current_user["id"], current_user["id"])
    )
    return jsonify([dict(f) for f in flagged]), 200