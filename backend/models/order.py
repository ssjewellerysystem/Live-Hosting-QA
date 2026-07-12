from backend.extensions import db
from datetime import datetime, timedelta
import random
import pytz
from backend.utils.timezone import format_iso_datetime, get_ist_time
from backend.utils.security import EncryptedJSON

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='SET NULL'), nullable=True)
    quantity = db.Column(db.Integer, default=1)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    image = db.Column(db.String(500), nullable=True)

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), unique=True, nullable=False)
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(50), default='Online')
    status = db.Column(db.String(50), default='Success')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

class OrderModel(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    order_status = db.Column(db.String(50), default='Pending')
    status = db.Column(db.String(50), default='Pending')
    delivery_date = db.Column(db.String(50), nullable=True)
    tracking_history = db.Column(db.JSON, nullable=True)
    return_request = db.Column(db.JSON, nullable=True)
    shipping_address = db.Column(EncryptedJSON, nullable=True)

    carrier = db.Column(db.String(100), nullable=True)
    tracking_id = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    terms_accepted = db.Column(db.Boolean, default=False, nullable=True)
    terms_accepted_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', cascade='all, delete-orphan', lazy=True)
    transaction = db.relationship('Transaction', backref='order', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        item_list = []
        for it in self.items:
            item_list.append({
                "product_id": str(it.product_id) if it.product_id else "",
                "name": it.name,
                "price": float(it.price),
                "quantity": int(it.quantity),
                "image": it.image or ""
            })
            
        return {
            "id": str(self.id),
            "_id": str(self.id),
            "order_id": self.order_id,
            "user_id": str(self.user_id) if self.user_id else None,
            "user_email": self.user.email if (self.user and self.user.email) else "Not Available",
            "shipping_address": self.shipping_address or {},
            "items": item_list,
            "total_amount": float(self.total_amount),
            "order_status": self.order_status,
            "status": self.order_status,
            "delivery_date": self.delivery_date,
            "tracking_history": self.tracking_history or [],
            "return_request": self.return_request or {
                "status": "None",
                "reason": "",
                "message": "",
                "created_at": None
            },
            "created_at": format_iso_datetime(self.created_at),
            "terms_accepted": self.terms_accepted,
            "terms_accepted_at": format_iso_datetime(self.terms_accepted_at) if self.terms_accepted_at else None
        }

    @staticmethod
    def create_order(user_id, shipping_address, items, total_amount, terms_accepted=False, commit=True):
        # Generate clean unique Order ID
        random_num = random.randint(100000, 999999)
        order_id = f"BB-{random_num}"
        
        est_delivery = (get_ist_time() + timedelta(days=5)).strftime("%d-%m-%Y")
        
        tracking_hist = [
            {
                "status": "Pending",
                "message": "Order placed successfully and is awaiting confirmation.",
                "updated_at": format_iso_datetime(get_ist_time())
            }
        ]
        
        ret_req = {
            "status": "None",
            "reason": "",
            "message": "",
            "created_at": None
        }
        
        parsed_user_id = None
        if user_id:
            try:
                parsed_user_id = int(user_id)
            except Exception:
                pass
                
        terms_accepted_at = get_ist_time() if terms_accepted else None
        order = OrderModel(
            order_id=order_id,
            user_id=parsed_user_id,
            shipping_address=shipping_address,
            total_amount=float(total_amount),
            order_status="Pending",
            status="Pending",
            delivery_date=est_delivery,
            tracking_history=tracking_hist,
            return_request=ret_req,
            created_at=get_ist_time(),
            terms_accepted=terms_accepted,
            terms_accepted_at=terms_accepted_at
        )
        db.session.add(order)
        db.session.flush()
        
        # Add items
        for it in items:
            p_id = None
            if it.get("product_id"):
                try:
                    p_id = int(it.get("product_id"))
                except Exception:
                    pass
            order_item = OrderItem(
                order_id=order.id,
                product_id=p_id,
                quantity=int(it.get("quantity", 1)),
                price=float(it.get("price", 0)),
                name=it.get("name", "Product"),
                image=it.get("image", "")
            )
            db.session.add(order_item)
            
        if commit:
            db.session.commit()
        else:
            db.session.flush()
        return order.to_dict()
    @staticmethod
    def find_by_user_id(user_id):
        try:
            uid = int(user_id)
            from sqlalchemy.orm import selectinload, joinedload
            orders = OrderModel.query.options(
                selectinload(OrderModel.items),
                joinedload(OrderModel.user)
            ).filter_by(user_id=uid).order_by(OrderModel.created_at.desc()).all()
            return [o.to_dict() for o in orders]
        except Exception:
            return []

    @staticmethod
    def find_all():
        try:
            from backend.models.user import UserModel
            from sqlalchemy.orm import selectinload, joinedload
            orders = OrderModel.query.outerjoin(UserModel, OrderModel.user_id == UserModel.id).options(
                selectinload(OrderModel.items),
                joinedload(OrderModel.user)
            ).order_by(OrderModel.created_at.desc()).all()
            return [o.to_dict() for o in orders]
        except Exception:
            return []

    @staticmethod
    def update_status(order_id, status, message=None, delivery_date=None, carrier=None, tracking_id=None):
        try:
            order = None
            if str(order_id).isdigit():
                order = OrderModel.query.with_for_update().get(int(order_id))
            if not order:
                order = OrderModel.query.filter_by(order_id=str(order_id)).with_for_update().first()
            if not order:
                return False
                
            tracking_history = order.tracking_history or []
            tracking_history.append({
                "status": status,
                "message": message or f"Order status changed to {status}.",
                "updated_at": format_iso_datetime(get_ist_time())
            })
            
            order.order_status = status
            order.status = status
            
            from sqlalchemy.orm.attributes import flag_modified
            order.tracking_history = tracking_history
            flag_modified(order, "tracking_history")
            
            if delivery_date:
                order.delivery_date = delivery_date
            if carrier:
                order.carrier = carrier
            if tracking_id:
                order.tracking_id = tracking_id
                
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            print("Error updating order status:", e)
            return False

    @staticmethod
    def request_return(order_id, reason, message):
        try:
            order = None
            if str(order_id).isdigit():
                order = OrderModel.query.with_for_update().get(int(order_id))
            if not order:
                order = OrderModel.query.filter_by(order_id=str(order_id)).with_for_update().first()
            if not order:
                return False
                
            order.return_request = {
                "status": "Requested",
                "reason": reason,
                "message": message,
                "created_at": format_iso_datetime(get_ist_time())
            }
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(order, "return_request")
            db.session.commit()

            try:
                from backend.models.admin import add_admin_notification
                add_admin_notification(
                    title="Order Return Requested",
                    message=f"Customer has requested a return for Order ID: {order.order_id}. Reason: {reason}",
                    type="return_requested",
                    user_id=order.user_id,
                    order_id=order.id
                )
            except Exception as ex:
                print(f"Error adding admin notification: {ex}")

            return True
        except Exception:
            db.session.rollback()
            return False

    @staticmethod
    def update_return_status(order_id, return_status, admin_message=None):
        try:
            order = None
            if str(order_id).isdigit():
                order = OrderModel.query.with_for_update().get(int(order_id))
            if not order:
                order = OrderModel.query.filter_by(order_id=str(order_id)).with_for_update().first()
            if not order:
                return False
                
            ret = order.return_request or {}
            ret["status"] = return_status
            if admin_message:
                ret["admin_message"] = admin_message
            ret["updated_at"] = format_iso_datetime(get_ist_time())
            
            order.return_request = ret
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(order, "return_request")
            
            if return_status == "Approved":
                order.order_status = "Cancelled"
                order.status = "Cancelled"
                
                history = order.tracking_history or []
                history.append({
                    "status": "Cancelled",
                    "message": "Return approved. Refund processed.",
                    "updated_at": format_iso_datetime(get_ist_time())
                })
                order.tracking_history = history
                flag_modified(order, "tracking_history")
            elif return_status == "Rejected":
                history = order.tracking_history or []
                history.append({
                    "status": order.status or "Delivered",
                    "message": f"Return rejected by admin: {admin_message}",
                    "updated_at": format_iso_datetime(get_ist_time())
                })
                order.tracking_history = history
                flag_modified(order, "tracking_history")
                
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False
