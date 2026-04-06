import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, jsonify
from config import Config


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def check_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_token(user_id: int, role: str) -> str:
    payload = {
        "sub":  str(user_id),
        "role": role,
        "exp":  datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRY_HOURS),
        "iat":  datetime.now(timezone.utc),
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")

def decode_token(token: str) -> dict:
    return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])

def require_auth(*allowed_roles: str):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing or malformed Authorization header"}), 401

            token = auth_header.split(" ", 1)[1]
            try:
                payload = decode_token(token)
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token has expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401

            if allowed_roles and payload["role"] not in allowed_roles:
                return jsonify({"error": "Access forbidden for your role"}), 403

            current_user = {"id": int(payload["sub"]), "role": payload["role"]}
            return f(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

def is_old_enough(dob_str: str) -> bool:
    from datetime import date
    dob = date.fromisoformat(dob_str)
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return age >= 18