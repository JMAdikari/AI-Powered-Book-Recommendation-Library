from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import func
from datetime import date, timedelta
from ..extensions import db, bcrypt
from ..models import User, UserPreference, UserBook, ReadingProgress

auth_bp = Blueprint("auth", __name__)


# ── POST /api/auth/register ──────────────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data     = request.get_json()
    email    = data.get("email", "").strip().lower()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not email or not username or not password:
        return jsonify({"error": "email, username and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    password_hash = bcrypt.generate_password_hash(password, rounds=12).decode("utf-8")
    user = User(email=email, username=username, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token, "user": user.to_dict()}), 201


# ── POST /api/auth/login ─────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token, "user": user.to_dict()}), 200


# ── GET /api/auth/me ─────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


# ── POST /api/auth/logout ────────────────────────────────────────────────────
@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    # JWT is stateless — client deletes the token
    return jsonify({"message": "Logged out"}), 200


# ── POST /api/auth/preferences ───────────────────────────────────────────────
@auth_bp.route("/preferences", methods=["POST"])
@jwt_required()
def create_preferences():
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    if UserPreference.query.filter_by(user_id=user_id).first():
        return jsonify({"error": "Preferences already set, use PUT to update"}), 409

    pref = UserPreference(
        user_id            = user_id,
        genres             = data.get("genres", []),
        favorite_authors   = data.get("favorite_authors", []),
        preferred_language = data.get("preferred_language", "en"),
    )
    db.session.add(pref)
    db.session.commit()
    return jsonify({"message": "Preferences saved"}), 201


# ── PUT /api/auth/preferences ────────────────────────────────────────────────
@auth_bp.route("/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    user_id = int(get_jwt_identity())
    data    = request.get_json()
    pref    = UserPreference.query.filter_by(user_id=user_id).first()

    if not pref:
        pref = UserPreference(user_id=user_id)
        db.session.add(pref)

    if "genres" in data:
        pref.genres = data["genres"]
    if "favorite_authors" in data:
        pref.favorite_authors = data["favorite_authors"]
    if "preferred_language" in data:
        pref.preferred_language = data["preferred_language"]

    db.session.commit()
    return jsonify({"message": "Preferences updated"}), 200


# ── GET /api/auth/preferences ────────────────────────────────────────────────
@auth_bp.route("/preferences", methods=["GET"])
@jwt_required()
def get_preferences():
    user_id = int(get_jwt_identity())
    pref    = UserPreference.query.filter_by(user_id=user_id).first()
    if not pref:
        return jsonify({"preference": None}), 200
    return jsonify({"preference": {
        "genres":             pref.genres or [],
        "favorite_authors":   pref.favorite_authors or [],
        "preferred_language": pref.preferred_language,
    }}), 200


# ── GET /api/auth/profile ────────────────────────────────────────────────────
@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    pref    = UserPreference.query.filter_by(user_id=user_id).first()
    return jsonify({
        "user": user.to_dict(),
        "preference": {
            "genres":             pref.genres if pref else [],
            "favorite_authors":   pref.favorite_authors if pref else [],
            "preferred_language": pref.preferred_language if pref else "en",
        },
    }), 200


# ── GET /api/auth/stats ──────────────────────────────────────────────────────
@auth_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    user_id = int(get_jwt_identity())

    total_saved     = UserBook.query.filter_by(user_id=user_id).count()
    total_completed = UserBook.query.filter_by(user_id=user_id, status="completed").count()
    total_favorites = UserBook.query.filter_by(user_id=user_id, is_favorite=True).count()
    total_reading   = UserBook.query.filter_by(user_id=user_id, status="reading").count()

    pages = db.session.query(func.sum(ReadingProgress.current_page))\
        .join(UserBook)\
        .filter(UserBook.user_id == user_id)\
        .scalar() or 0

    progress_dates = db.session.query(
        func.date(ReadingProgress.last_read_at)
    ).join(UserBook).filter(UserBook.user_id == user_id)\
     .distinct().order_by(func.date(ReadingProgress.last_read_at).desc()).all()

    streak = 0
    today  = date.today()
    for i, (d,) in enumerate(progress_dates):
        expected = today - timedelta(days=i)
        if str(d) == str(expected):
            streak += 1
        else:
            break

    return jsonify({"stats": {
        "total_saved":         total_saved,
        "total_completed":     total_completed,
        "total_favorites":     total_favorites,
        "currently_reading":   total_reading,
        "total_pages_read":    pages,
        "reading_streak_days": streak,
    }}), 200
