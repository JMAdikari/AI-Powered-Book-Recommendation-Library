import os
from flask import Flask
from .config import DevelopmentConfig, ProductionConfig
from .extensions import db, jwt, bcrypt, migrate, cors


def create_app():
    app = Flask(__name__)

    env = os.getenv("FLASK_ENV", "development")
    if env == "production":
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(DevelopmentConfig)

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

    # Register blueprints
    from .routes.health import health_bp
    app.register_blueprint(health_bp, url_prefix="/api")

    return app
