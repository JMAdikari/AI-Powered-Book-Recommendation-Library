"""
Configuration classes for development and production environments.
Select via FLASK_ENV environment variable or pass config_name to create_app().
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "change-me-in-production")
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "change-me-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_DAYS", 7))
    )
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    GOOGLE_BOOKS_API_KEY: str = os.environ.get("GOOGLE_BOOKS_API_KEY", "")
    ALLOWED_ORIGINS: list = [
        o.strip()
        for o in os.environ.get(
            "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
        ).split(",")
    ]


class DevelopmentConfig(BaseConfig):
    DEBUG: bool = True
    SQLALCHEMY_DATABASE_URI: str = os.environ.get(
        "DATABASE_URL", "sqlite:///app.db"
    )


class ProductionConfig(BaseConfig):
    DEBUG: bool = False
    SQLALCHEMY_DATABASE_URI: str = os.environ.get("DATABASE_URL", "")
    # Enforce HTTPS cookie flags in production
    SESSION_COOKIE_SECURE: bool = True
    SESSION_COOKIE_HTTPONLY: bool = True


config_by_name: dict = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
