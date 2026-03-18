import os
from datetime import timedelta


class Config:
    SECRET_KEY                     = os.getenv("SECRET_KEY", "dev-secret-change-in-prod")
    JWT_SECRET_KEY                 = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-in-prod")
    JWT_ACCESS_TOKEN_EXPIRES       = timedelta(hours=24)
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(Config):
    DEBUG                   = True
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///bookai_dev.db")


class ProductionConfig(Config):
    DEBUG                   = False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
