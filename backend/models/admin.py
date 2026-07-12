from backend.extensions import db
from datetime import datetime
import pytz
from backend.utils.timezone import format_iso_datetime, get_ist_time

class AdminModel(db.Model):
    __tablename__ = 'admins'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

    def to_dict(self):
        return {
            "id": str(self.id),
            "_id": str(self.id),
            "username": self.username,
            "created_at": format_iso_datetime(self.created_at)
        }

class AdminAuditLog(db.Model):
    __tablename__ = 'admin_audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    admin_username = db.Column(db.String(100), nullable=False)
    action_type = db.Column(db.String(100), nullable=False)
    module = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default='Success')
    created_at = db.Column(db.DateTime, default=get_ist_time)

    def to_dict(self):
        timestamp_str = self.created_at.strftime('%d-%b-%Y %I:%M %p')
        return {
            "id": str(self.id),
            "admin_name": self.admin_username,
            "admin_username": self.admin_username,
            "action_type": self.action_type,
            "module": self.module,
            "details": self.details or "",
            "status": self.status,
            "timestamp": timestamp_str,
            "created_at": format_iso_datetime(self.created_at) if self.created_at else None,
            "created_at_iso": format_iso_datetime(self.created_at)
        }


class AdminNotification(db.Model):
    __tablename__ = 'admin_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=get_ist_time, nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "title": self.title,
            "message": self.message,
            "read": bool(self.read),
            "created_at": format_iso_datetime(self.created_at) if self.created_at else None
        }


def add_admin_notification(title, message, type=None, user_id=None, order_id=None):
    if type not in ['SUPPORT_TICKET', 'NEW_ORDER', 'LOW_STOCK', 'BUY_REQUEST']:
        return False
    try:
        notification = AdminNotification(title=title, message=message)
        db.session.add(notification)
        db.session.commit()
        
        try:
            from backend.utils.notifications import create_notification
            create_notification(
                type=type,
                title=title,
                description=message,
                user_id=user_id,
                order_id=order_id
            )
        except Exception as ex:
            print(f"Error calling create_notification: {ex}")
            
        return True
    except Exception as e:
        print(f"Error adding admin notification: {e}")
        db.session.rollback()
        return False


