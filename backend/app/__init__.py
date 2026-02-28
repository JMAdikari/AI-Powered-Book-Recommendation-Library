"""
Flask application factory.
Initialises extensions and registers blueprints.
"""

from flask import Flask
from .config import config_by_name
from .extensions import db, jwt, cors, bcrypt, migrate


def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Initialise extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config.get("ALLOWED_ORIGINS", "*")}},
        supports_credentials=True,
    )

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.books import books_bp
    from .routes.library import library_bp
    from .routes.recommendations import recommendations_bp
    from .routes.profile import profile_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(books_bp, url_prefix="/api/books")
    app.register_blueprint(library_bp, url_prefix="/api/library")
    app.register_blueprint(recommendations_bp, url_prefix="/api/recommendations")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")

    # Health-check endpoint
    @app.get("/api/health")
    def health():
        return {"status": "ok"}, 200

    return app
