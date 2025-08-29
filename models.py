from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize SQLAlchemy instance
db = SQLAlchemy()

class EventRegistration(db.Model):
    """
    Model for storing event registrations.
    Each record represents a user's registration to an event.
    """
    __tablename__ = "event_registrations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), nullable=False)  # User identifier (could be email or student ID)
    event_id = db.Column(db.String(50), nullable=False)  # Event identifier
    qr_code = db.Column(db.String(200), unique=True, nullable=False)  # QR code string
    checked_in = db.Column(db.Boolean, default=False)  # Check-in status
    registration_time = db.Column(db.DateTime, default=datetime.utcnow)  # When the user registered
    checkin_time = db.Column(db.DateTime, nullable=True)  # When the user checked-in

    def __repr__(self):
        return f"<EventRegistration user_id={self.user_id}, event_id={self.event_id}, checked_in={self.checked_in}>"
