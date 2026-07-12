from backend.extensions import db
from datetime import datetime
import pytz
from backend.utils.timezone import format_iso_datetime, get_ist_time

class CouponModel(db.Model):
    __tablename__ = 'coupons'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    discount_type = db.Column(db.String(20), nullable=False) # 'percent' or 'flat'
    discount_value = db.Column(db.Numeric(10, 2), nullable=False)
    min_order_amount = db.Column(db.Numeric(10, 2), default=0.00)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

    def to_dict(self):
        return {
            "id": str(self.id),
            "_id": str(self.id),
            "code": self.code,
            "discount_type": self.discount_type,
            "discount_value": float(self.discount_value),
            "min_order_amount": float(self.min_order_amount),
            "is_active": bool(self.is_active),
            "created_at": format_iso_datetime(self.created_at)
        }

    @staticmethod
    def create_coupon(code, discount_type, discount_value, min_order_amount=0.0, is_active=True):
        try:
            code = code.strip().upper()
            existing = CouponModel.query.filter_by(code=code).first()
            if existing:
                return None
                
            coupon = CouponModel(
                code=code,
                discount_type=discount_type,
                discount_value=float(discount_value),
                min_order_amount=float(min_order_amount),
                is_active=bool(is_active),
                created_at=get_ist_time()
            )
            db.session.add(coupon)
            db.session.commit()
            return coupon.to_dict()
        except Exception as e:
            print("Error creating coupon:", e)
            db.session.rollback()
            return None

    @staticmethod
    def find_by_code(code):
        try:
            coupon = CouponModel.query.filter_by(code=code.strip().upper(), is_active=True).first()
            return coupon.to_dict() if coupon else None
        except Exception:
            return None

    @staticmethod
    def find_all():
        try:
            coupons = CouponModel.query.all()
            return [c.to_dict() for c in coupons]
        except Exception:
            return []

    @staticmethod
    def delete_coupon(coupon_id):
        try:
            cid = int(coupon_id)
            coupon = CouponModel.query.get(cid)
            if coupon:
                db.session.delete(coupon)
                db.session.commit()
                return True
            return False
        except Exception:
            return False
