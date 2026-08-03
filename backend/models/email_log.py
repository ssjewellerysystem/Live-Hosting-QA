from backend.extensions import db
from backend.utils.timezone import format_iso_datetime, get_ist_time

class EmailLog(db.Model):
    __tablename__ = 'email_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    recipient = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    email_type = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='SENT')
    sent_at = db.Column(db.DateTime, default=get_ist_time)
    failure_reason = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "recipient": self.recipient,
            "subject": self.subject,
            "email_type": self.email_type,
            "status": self.status,
            "sent_at": format_iso_datetime(self.sent_at),
            "failure_reason": self.failure_reason
        }
