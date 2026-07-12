from backend.extensions import db
from datetime import datetime
import pytz
from backend.utils.timezone import format_iso_datetime

class NotificationModel(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True)
    status = db.Column(db.String(50), default='unread', nullable=False) # 'unread' or 'read'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    read_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship('UserModel', foreign_keys=[user_id])
    order = db.relationship('OrderModel', foreign_keys=[order_id])

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "description": self.description,
            "user_id": self.user_id,
            "order_id": self.order_id,
            "status": self.status,
            "created_at": format_iso_datetime(self.created_at) if self.created_at else None,
            "read_at": format_iso_datetime(self.read_at) if self.read_at else None
        }
