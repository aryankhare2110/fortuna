from flask import Blueprint, request, jsonify
from db import query, execute
from auth import require_auth

player_bp = Blueprint("player", __name__, url_prefix="/api/player")

COLUMN_MAP = {"username": "Username", "last_name": "LastName"}


@player_bp.get("/profile")
@require_auth("player")
def get_profile(current_user):
    player = query(
        """
        SELECT
            p.PlayerID, p.Username, p.FirstName, p.LastName,
            p.Email, p.DOB, p.WalletBalance, p.BlockStatus,
            p.TotalWinnings, p.RewardPoints, p.GamesPlayed,
            MAX(CASE WHEN l.MetricType = 'total_winnings' THEN l.Rank END) AS WinningsRank,
            MAX(CASE WHEN l.MetricType = 'net_profit'     THEN l.Rank END) AS ProfitRank,
            MAX(CASE WHEN l.MetricType = 'games_played'   THEN l.Rank END) AS GamesRank
        FROM Player p
        LEFT JOIN Leaderboard l ON l.PlayerID = p.PlayerID
        WHERE p.PlayerID = %s
        GROUP BY p.PlayerID
        """,
        (current_user["id"],),
        fetchone=True
    )
    if not player:
        return jsonify({"error": "Player not found"}), 404
    return jsonify(dict(player)), 200


@player_bp.patch("/profile")
@require_auth("player")
def update_profile(current_user):
    data    = request.get_json() or {}
    updates = {COLUMN_MAP[k]: v for k, v in data.items() if k in COLUMN_MAP and v}

    if not updates:
        return jsonify({"error": "Nothing to update"}), 400

    set_clause = ", ".join(f"{col} = %s" for col in updates)
    execute(
        f"UPDATE Player SET {set_clause} WHERE PlayerID = %s",
        (*updates.values(), current_user["id"])
    )
    return jsonify({"message": "Profile updated"}), 200


@player_bp.post("/wallet/deposit")
@require_auth("player")
def deposit(current_user):
    data   = request.get_json() or {}
    amount = data.get("amount")

    if not amount or float(amount) <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    amount = float(amount)

    from db import get_db, release_db
    import psycopg2
    import psycopg2.extras

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Lock the row immediately with NOWAIT to enforce serializability
            cur.execute("SELECT WalletBalance FROM Player WHERE PlayerID = %s FOR UPDATE NOWAIT", (current_user["id"],))
            
            # Simulate a slow transaction for demonstrating conflict!
            cur.execute("SELECT pg_sleep(3)")

            cur.execute(
                """
                UPDATE Player
                SET WalletBalance = WalletBalance + %s
                WHERE PlayerID = %s
                RETURNING WalletBalance
                """,
                (amount, current_user["id"])
            )
            result = cur.fetchone()
        conn.commit()
    except psycopg2.errors.LockNotAvailable:
        conn.rollback()
        return jsonify({"error": "Transaction Conflict: Your wallet is currently locked by another active operation. Please wait."}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        release_db(conn)

    return jsonify({
        "message":        "Deposit successful",
        "wallet_balance": float(result["walletbalance"])
    }), 200


@player_bp.post("/wallet/withdraw")
@require_auth("player")
def withdraw(current_user):
    data   = request.get_json() or {}
    amount = data.get("amount")

    if not amount or float(amount) <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    amount = float(amount)

    from db import get_db, release_db
    import psycopg2
    import psycopg2.extras

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Use FOR UPDATE NOWAIT to prevent double-spending withdrawals and catch conflicts
            cur.execute("SELECT WalletBalance FROM Player WHERE PlayerID = %s FOR UPDATE NOWAIT", (current_user["id"],))
            player = cur.fetchone()

            if float(player["walletbalance"]) < amount:
                conn.rollback()
                return jsonify({"error": "Insufficient balance"}), 400

            cur.execute(
                """
                UPDATE Player
                SET WalletBalance = WalletBalance - %s
                WHERE PlayerID = %s
                RETURNING WalletBalance
                """,
                (amount, current_user["id"])
            )
            result = cur.fetchone()
        conn.commit()
    except psycopg2.errors.LockNotAvailable:
        conn.rollback()
        return jsonify({"error": "Transaction Conflict: Your wallet is currently locked by another active operation. Please wait."}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        release_db(conn)

    return jsonify({
        "message":        "Withdrawal successful",
        "wallet_balance": float(result["walletbalance"])
    }), 200


@player_bp.get("/wallet/transactions")
@require_auth("player")
def transaction_history(current_user):
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    offset   = (page - 1) * per_page

    txns = query(
        """
        SELECT TxnID, Type, Amount, TxnTime, BalanceAfter, PointTransaction
        FROM Wallet_Transaction
        WHERE PlayerID = %s
        ORDER BY TxnTime DESC
        LIMIT %s OFFSET %s
        """,
        (current_user["id"], per_page, offset)
    )
    return jsonify([dict(t) for t in txns]), 200


@player_bp.post("/rewards/redeem")
@require_auth("player")
def redeem_rewards(current_user):
    data   = request.get_json() or {}
    points = int(data.get("points", 0))

    if points < 100 or points % 100 != 0:
        return jsonify({"error": "Redeem in multiples of 100 points (min 100)"}), 400

    from db import get_db, release_db
    import psycopg2
    import psycopg2.extras

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT RewardPoints, WalletBalance FROM Player WHERE PlayerID = %s FOR UPDATE NOWAIT", (current_user["id"],))
            player = cur.fetchone()

            if player["rewardpoints"] < points:
                conn.rollback()
                return jsonify({"error": "Insufficient reward points"}), 400

            credit = (points / 100) * 50.0

            cur.execute(
                """
                UPDATE Player
                SET RewardPoints  = RewardPoints  - %s,
                    WalletBalance = WalletBalance + %s
                WHERE PlayerID = %s
                RETURNING WalletBalance, RewardPoints
                """,
                (points, credit, current_user["id"])
            )
            result = cur.fetchone()

            cur.execute(
                """
                INSERT INTO Wallet_Transaction
                    (PlayerID, Type, Amount, BalanceAfter, PointTransaction)
                VALUES (%s, 'reward_redemption', %s, %s, %s)
                """,
                (current_user["id"], credit, result["walletbalance"], -points)
            )
        conn.commit()
    except psycopg2.errors.LockNotAvailable:
        conn.rollback()
        return jsonify({"error": "Transaction Conflict: Your wallet is currently locked by another active operation. Please wait."}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        release_db(conn)

    return jsonify({
        "message":        f"Redeemed {points} points for {credit:.2f}",
        "wallet_balance": float(result["walletbalance"]),
        "reward_points":  result["rewardpoints"]
    }), 200


@player_bp.get("/history")
@require_auth("player")
def bet_history(current_user):
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    offset   = (page - 1) * per_page

    bets = query(
        """
        SELECT
            b.BetTime, g.GameName, b.SessionID,
            b.Amount, b.Result, b.Payout,
            b.Payout - b.Amount AS profit_on_bet
        FROM Bet b
        JOIN Game_Session gs ON gs.SessionID = b.SessionID
        JOIN Game g          ON g.GameID     = gs.GameID
        WHERE b.PlayerID = %s
        ORDER BY b.BetTime DESC
        LIMIT %s OFFSET %s
        """,
        (current_user["id"], per_page, offset)
    )
    return jsonify([dict(b) for b in bets]), 200


@player_bp.get("/stats")
@require_auth("player")
def player_stats(current_user):
    overall = query(
        """
        SELECT
            COUNT(*)                                                    AS total_bets,
            COUNT(*) FILTER (WHERE Result = 'win')                      AS wins,
            COUNT(*) FILTER (WHERE Result = 'loss')                     AS losses,
            COUNT(*) FILTER (WHERE Result = 'draw')                     AS draws,
            COALESCE(SUM(Amount),  0)                                   AS total_wagered,
            COALESCE(SUM(Payout),  0)                                   AS total_payout,
            COALESCE(SUM(Payout) - SUM(Amount), 0)                      AS net_profit,
            ROUND(COUNT(*) FILTER (WHERE Result = 'win') * 100.0
                  / NULLIF(COUNT(*), 0), 2)                             AS win_rate_pct,
            ROUND(COALESCE(AVG(Amount), 0), 2)                          AS avg_bet_size,
            COALESCE(MAX(Payout), 0)                                    AS biggest_payout
        FROM Bet
        WHERE PlayerID = %s
        """,
        (current_user["id"],),
        fetchone=True
    )

    per_game = query(
        """
        SELECT
            g.GameName,
            COUNT(b.*)                                                  AS total_bets,
            ROUND(COALESCE(AVG(b.Amount), 0), 2)                        AS avg_bet,
            COALESCE(SUM(b.Payout) - SUM(b.Amount), 0)                  AS net_profit,
            ROUND(COUNT(*) FILTER (WHERE b.Result = 'win') * 100.0
                  / NULLIF(COUNT(*), 0), 2)                             AS win_rate_pct
        FROM Bet b
        JOIN Game_Session gs ON gs.SessionID = b.SessionID
        JOIN Game g          ON g.GameID     = gs.GameID
        WHERE b.PlayerID = %s
        GROUP BY g.GameName
        ORDER BY net_profit DESC
        """,
        (current_user["id"],)
    )

    return jsonify({
        "overall":  dict(overall),
        "per_game": [dict(g) for g in per_game]
    }), 200