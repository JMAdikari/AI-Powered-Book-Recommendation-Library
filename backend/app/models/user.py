from ..extensions import db
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    username      = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role          = db.Column(db.String(20), default="user", nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    preference = db.relationship("UserPreference", back_populates="user", uselist=False)
    books      = db.relationship("UserBook", back_populates="user")

    def to_dict(self):
        return {
            "id":         self.id,
            "email":      self.email,
            "username":   self.username,
            "role":       self.role,
            "created_at": self.created_at.isoformat(),
        }
