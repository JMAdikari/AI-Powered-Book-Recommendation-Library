import os
from flask import Flask, jsonify
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
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Import models so Flask-Migrate can detect them
    from .models import (  # noqa: F401
        User, UserPreference, Book, BookContent, UserBook, ReadingProgress
    )

    # Register blueprints (matches IMPLEMENTATION_PLAN.md routes/ structure)
    from .routes.auth            import auth_bp
    from .routes.books           import books_bp
    from .routes.library         import library_bp
    from .routes.recommendations import rec_bp
    from .routes.admin           import admin_bp

    app.register_blueprint(auth_bp,    url_prefix="/api/auth")
    app.register_blueprint(books_bp,   url_prefix="/api/books")
    app.register_blueprint(library_bp, url_prefix="/api/library")
    app.register_blueprint(rec_bp,     url_prefix="/api/recommendations")
    app.register_blueprint(admin_bp,   url_prefix="/api/admin")

    # Health check (inline — no separate blueprint needed)
    @app.route("/api/health")
    def health():  # noqa: used by Flask route decorator
        return jsonify({"status": "ok"}), 200

    return app
