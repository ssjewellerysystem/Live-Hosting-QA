import os
import jwt
from flask import request
from backend.models.admin import AdminAuditLog
from backend.extensions import db

JWT_SECRET = os.getenv("JWT_SECRET", "supersecret_SSJewellery_key_123")

def log_admin_action(action_type, module, details, status="Success", user_id=None, order_id=None):
    admin_name = "admin"
    token = None
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        if auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
            
    if token:
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            if data.get("user_id") == "admin_user" and data.get("is_admin"):
                admin_name = "admin"
            else:
                from backend.models.user import UserModel
                user = UserModel.find_by_id(data.get("user_id"))
                if user:
                    admin_name = user.get("username") or user.get("email") or "admin"
        except Exception:
            pass
            
    try:
        log = AdminAuditLog(
            admin_username=admin_name,
            action_type=action_type,
            module=module,
            details=details,
            status=status
        )
        db.session.add(log)
        db.session.commit()
        
        # Trigger notification for admin actions
        if action_type != "Admin Login":
            try:
                from backend.utils.notifications import create_notification
                notif_type = "admin_action"
                if action_type == "User Blocked":
                    notif_type = "user_blocked"
                elif action_type == "User Unblocked":
                    notif_type = "user_unblocked"
                elif action_type == "Product Added":
                    notif_type = "product_added"
                elif action_type == "Product Updated":
                    notif_type = "product_updated"
                elif action_type == "Order Cancelled":
                    notif_type = "order_cancelled"
                elif action_type == "Order Updated" and "to 'Delivered'" in details:
                    notif_type = "order_delivered"
                
                create_notification(
                    type=notif_type,
                    title=f"{action_type}",
                    description=details,
                    user_id=user_id,
                    order_id=order_id
                )
            except Exception as ex:
                print("Failed to auto-create admin notification for audit log:", ex)
    except Exception as e:
        print("Failed to save admin audit log:", e)
        db.session.rollback()
