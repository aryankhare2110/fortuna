from flask import Blueprint, request, jsonify
from db   import query, execute
from auth import hash_password, check_password, create_token, is_old_enough

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _missing(*fields):
    data = request.get_json() or {}
    for f in fields:
        if not data.get(f):
            return f
    return None

@auth_bp.post("/player/register")
def player_register():
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

    token = create_token(player["playerid"], "player")
    return jsonify({
        "message": "Registration successful",
        "token":   token,
        "player":  dict(player)
    }), 201


@auth_bp.post("/player/login")
def player_login():
    data = request.get_json() or {}
    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    player = query(
        "SELECT PlayerID, Username, Email, PasswordHashed, BlockStatus FROM Player WHERE Email = %s",
        (data["email"],),
        fetchone=True
    )

    if not player or not check_password(data["password"], player["passwordhashed"]):
        return jsonify({"error": "Invalid email or password"}), 401

    if player["blockstatus"]:
        return jsonify({"error": "Your account has been suspended"}), 403

    token = create_token(player["playerid"], "player")
    return jsonify({
        "message": "Login successful",
        "token":   token,
        "player": {
            "id":       player["playerid"],
            "username": player["username"],
            "email":    player["email"],
        }
    }), 200

@auth_bp.post("/dealer/login")
def dealer_login():
    data = request.get_json() or {}
    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    dealer = query(
        "SELECT DealerID, FirstName, Email, PasswordHashed, IsAvailable FROM Dealer WHERE Email = %s",
        (data["email"],),
        fetchone=True
    )

    if not dealer or not check_password(data["password"], dealer["passwordhashed"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_token(dealer["dealerid"], "dealer")
    return jsonify({
        "message": "Login successful",
        "token":   token,
        "dealer": {
            "id":           dealer["dealerid"],
            "first_name":   dealer["firstname"],
            "email":        dealer["email"],
            "is_available": dealer["isavailable"],
        }
    }), 200

@auth_bp.post("/admin/login")
def admin_login():
    data = request.get_json() or {}
    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    admin = query(
        "SELECT AdminID, FirstName, Email, PasswordHashed FROM Admin WHERE Email = %s",
        (data["email"],),
        fetchone=True
    )

    if not admin or not check_password(data["password"], admin["passwordhashed"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_token(admin["adminid"], "admin")
    return jsonify({
        "message": "Login successful",
        "token":   token,
        "admin": {
            "id":         admin["adminid"],
            "first_name": admin["firstname"],
            "email":      admin["email"],
        }
    }), 200