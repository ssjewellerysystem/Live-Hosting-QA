from backend.extensions import db
from datetime import datetime
import pytz
from backend.utils.timezone import format_iso_datetime, get_ist_time
from backend.utils.security import EncryptedString

class OTPVerification(db.Model):
    __tablename__ = 'otp_verifications'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(EncryptedString(255), nullable=False)

    otp_code = db.Column(db.String(10), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=get_ist_time)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0)
    resend_attempts = db.Column(db.Integer, default=0)
    temporary_user_data = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "_id": str(self.id),
            "email": self.email,
            "otp_code": self.otp_code,
            "is_verified": bool(self.is_verified),
            "attempts": self.attempts,
            "resend_attempts": self.resend_attempts,
            "expires_at": format_iso_datetime(self.expires_at),
            "created_at": format_iso_datetime(self.created_at)
        }
