from .auth import auth_bp
from .books import books_bp
from .library import library_bp
from .recommendations import recommendations_bp
from .profile import profile_bp

__all__ = ["auth_bp", "books_bp", "library_bp", "recommendations_bp", "profile_bp"]
