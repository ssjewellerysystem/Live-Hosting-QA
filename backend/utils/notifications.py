from backend.models.notification import NotificationModel
from backend.extensions import db
from datetime import datetime
import pytz

def create_notification(type, title, description, user_id=None, order_id=None):
    if type not in ['SUPPORT_TICKET', 'NEW_ORDER', 'LOW_STOCK', 'BUY_REQUEST']:
        return None
    try:
        notification = NotificationModel(
            type=type,
            title=title,
            description=description,
            user_id=user_id,
            order_id=order_id,
            status='unread'
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    except Exception as e:
        print(f"Error creating notification: {e}")
        db.session.rollback()
        return None
