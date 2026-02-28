"""
Authentication routes.

POST /api/auth/register  — Register a new user and return JWT
POST /api/auth/login     — Login and return JWT
"""

import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from ..extensions import db, bcrypt
from ..models.user import User, UserPreference

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    """
    Register a new user.

    Expected JSON body:
    {
        "email": "user@example.com",
        "password": "min8chars",
        "preferences": {                 // optional — from onboarding step
            "genres": ["Adventure", "Mystery"],
            "mood": "Escape into another world",
            "reference_book": "Treasure Island"  // optional
        }
    }

    Returns 201 with { "access_token": "...", "user": { id, email } }
    Returns 400 for validation errors
    Returns 409 if email already registered
    """
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    # --- Validation ---
    if not email:
        return jsonify({"error": "Email is required."}), 400
    if "@" not in email:
        return jsonify({"error": "Enter a valid email address."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    # --- Duplicate check ---
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists. Log in instead."}), 409

    # --- Create user ---
    pw_hash = bcrypt.generate_password_hash(password, rounds=12).decode("utf-8")
    user = User(email=email, password_hash=pw_hash)
    db.session.add(user)
    db.session.flush()  # get user.id before commit

    # --- Save onboarding preferences if provided ---
    prefs_data = data.get("preferences") or {}
    if prefs_data:
        genres = prefs_data.get("genres") or []
        preference = UserPreference(
            user_id=user.id,
            genres=json.dumps(genres),
            mood=prefs_data.get("mood"),
            reference_book=prefs_data.get("reference_book"),
        )
        db.session.add(preference)

    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    """
    Login with email and password.

    Expected JSON body:
    { "email": "user@example.com", "password": "yourpassword" }

    Returns 200 with { "access_token": "...", "user": { id, email } }
    Returns 401 on bad credentials
    """
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user: User | None = User.query.filter_by(email=email).first()

    # Intentionally vague error to avoid user enumeration (Story 1.3)
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Incorrect email or password."}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()}), 200
