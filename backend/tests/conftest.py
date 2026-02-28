"""
Pytest configuration and shared fixtures.
"""

import pytest
from app import create_app
from app.extensions import db as _db


@pytest.fixture(scope="session")
def app():
    """Create a test Flask application using an in-memory SQLite database."""
    test_config = {
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-jwt-secret-key-for-testing-only",
        "SECRET_KEY": "test-secret-key-for-testing-only",
    }
    _app = create_app("development")
    _app.config.update(test_config)

    with _app.app_context():
        _db.create_all()
        yield _app
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    """Return a test client for the Flask app."""
    return app.test_client()


@pytest.fixture(scope="function")
def db(app):
    """Yield the database and clean up after each test."""
    with app.app_context():
        yield _db
        _db.session.rollback()
