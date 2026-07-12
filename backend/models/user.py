import bcrypt
from datetime import datetime
import pytz
from backend.extensions import db
from backend.utils.timezone import format_iso_datetime
from backend.utils.security import EncryptedString


class DeliveryAddress(db.Model):
    __tablename__ = 'delivery_addresses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    house_number = db.Column(EncryptedString(255), default="")
    building_name = db.Column(EncryptedString(255), default="")
    street = db.Column(EncryptedString(500), default="")
    area = db.Column(EncryptedString(500), default="")
    landmark = db.Column(EncryptedString(500), default="")
    city = db.Column(EncryptedString(255), default="")
    state = db.Column(EncryptedString(255), default="")
    pincode = db.Column(EncryptedString(255), default="")
    address_type = db.Column(db.String(50), default="Home")
    alternate_mobile_number = db.Column(db.String(15), nullable=True)
    country = db.Column(EncryptedString(255), default="India")

    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "house_number": self.house_number or "",
            "building_name": self.building_name or "",
            "street": self.street or "",
            "area": self.area or "",
            "landmark": self.landmark or "",
            "city": self.city or "",
            "state": self.state or "",
            "pincode": self.pincode or "",
            "address_type": self.address_type or "Home",
            "is_default": bool(self.is_default),
            "alternate_mobile_number": self.alternate_mobile_number or "",
            "country": self.country or "India",
            "created_at": format_iso_datetime(self.created_at) if hasattr(self, 'created_at') else None
        }

class Cart(db.Model):
    __tablename__ = 'carts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    
    items = db.relationship('CartItem', backref='cart', cascade='all, delete-orphan', lazy=True)

class CartItem(db.Model):
    __tablename__ = 'cart_items'
    
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    saved_for_later = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

class Wishlist(db.Model):
    __tablename__ = 'wishlists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

class UserModel(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(EncryptedString(255), nullable=False)
    email = db.Column(EncryptedString(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(EncryptedString(255), nullable=True)
    notifications = db.Column(db.JSON, default=list) # List of notifications
    is_blocked = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)
    email_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')), onupdate=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    microsoft_id = db.Column(db.String(100), unique=True, nullable=True)
    provider = db.Column(db.String(50), default="local")
    provider_id = db.Column(db.String(255), unique=True, nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)
    preferred_language = db.Column(db.String(10), default=None, nullable=True)
    first_login = db.Column(db.Boolean, default=True, nullable=False)
    
    # Compatibility properties for name, password, mobile, is_verified
    @property
    def name(self):
        return self.full_name
    @name.setter
    def name(self, value):
        self.full_name = value

    @property
    def password(self):
        return self.password_hash
    @password.setter
    def password(self, value):
        self.password_hash = value

    @property
    def mobile(self):
        return self.phone
    @mobile.setter
    def mobile(self, value):
        self.phone = value

    @property
    def is_verified(self):
        return self.email_verified
    @is_verified.setter
    def is_verified(self, value):
        self.email_verified = value

    # Relationships
    addresses = db.relationship('DeliveryAddress', backref='user', lazy=True, cascade='all, delete-orphan')
    cart = db.relationship('Cart', backref='user', uselist=False, cascade='all, delete-orphan')
    wishlist_items = db.relationship('Wishlist', backref='user', cascade='all, delete-orphan')
    reviews = db.relationship('ReviewModel', backref='user', lazy=True)
    orders = db.relationship('OrderModel', backref='user', lazy=True)

    @property
    def address(self):
        # Return default address if exists, otherwise first address, or None
        if not self.addresses:
            return None
        default_addr = next((addr for addr in self.addresses if addr.is_default), None)
        return default_addr or self.addresses[0]

    @address.setter
    def address(self, value):
        if not self.addresses:
            self.addresses = [value]
        else:
            for a in self.addresses:
                a.is_default = False
            value.is_default = True
            self.addresses.append(value)

    def to_dict(self):
        # Address
        addr = self.address
        addr_dict = {
            "id": addr.id if addr else None,
            "house_number": addr.house_number if addr else "",
            "building_name": addr.building_name if addr else "",
            "street": addr.street if addr else "",
            "area": addr.area if addr else "",
            "landmark": addr.landmark if addr else "",
            "city": addr.city if addr else "",
            "state": addr.state if addr else "",
            "pincode": addr.pincode if addr else "",
            "address_type": addr.address_type if addr else "Home",
            "is_default": addr.is_default if addr else False,
            "alternate_mobile_number": addr.alternate_mobile_number if addr else ""
        }
        
        # Wishlist
        wishlist_list = []
        for item in self.wishlist_items:
            if item.product:
                wishlist_list.append(item.product.to_dict())
                
        # Determine language from request
        from flask import request
        lang = None
        try:
            if request:
                lang = request.args.get('lang') or request.headers.get('Accept-Language')
                if lang:
                    lang = lang.split(',')[0].split('-')[0].strip().lower()
        except Exception:
            pass

        # Cart
        cart_list = []
        cart = self.cart
        if cart:
            for item in cart.items:
                if not item.saved_for_later and item.product:
                    p = item.product
                    p_name = p.name_hi if lang == 'hi' and p.name_hi else (p.name_en or p.name)
                    final_price = float(p.price) * (1 - float(p.discount) / 100.0)
                    cart_list.append({
                        "product_id": str(p.id),
                        "_id": str(p.id),
                        "name": p_name,
                        "price": float(p.price),
                        "discount": float(p.discount),
                        "finalPrice": float(round(final_price, 2)),
                        "image": p.images[0] if p.images else "",
                        "quantity": int(item.quantity),
                        "stock": int(p.stock)
                    })
                    
        # Saved for later
        saved_list = []
        if cart:
            for item in cart.items:
                if item.saved_for_later and item.product:
                    p = item.product
                    p_name = p.name_hi if lang == 'hi' and p.name_hi else (p.name_en or p.name)
                    final_price = float(p.price) * (1 - float(p.discount) / 100.0)
                    saved_list.append({
                        "product_id": str(p.id),
                        "_id": str(p.id),
                        "name": p_name,
                        "price": float(p.price),
                        "discount": float(p.discount),
                        "finalPrice": float(round(final_price, 2)),
                        "image": p.images[0] if p.images else "",
                        "quantity": int(item.quantity),
                        "stock": int(p.stock)
                    })
                    
        return {
            "id": str(self.id),
            "_id": str(self.id),
            "name": self.name,
            "email": self.email,
            "mobile": self.mobile or "",
            "address": addr_dict,
            "addresses": [addr.to_dict() for addr in self.addresses] if self.addresses else [],
            "wishlist": wishlist_list,
            "cart": cart_list,
            "saved_for_later": saved_list,
            "notifications": self.notifications or [],
            "is_blocked": bool(self.is_blocked),
            "is_admin": bool(self.is_admin),
            "is_verified": bool(self.is_verified),
            "created_at": format_iso_datetime(self.created_at),
            "last_login": format_iso_datetime(self.last_login),
            "microsoft_id": self.microsoft_id,
            "provider": self.provider or "local",
            "provider_id": self.provider_id,
            "preferred_language": self.preferred_language,
            "first_login": bool(self.first_login),
            "role": "admin" if self.is_admin else "customer"
        }

    @staticmethod
    def create_user(name, email, password, mobile, address=None, is_admin=False):
        import os
        # Check if user already exists
        if UserModel.query.filter_by(email=email).first():
            return None
            
        # Check if password is already hashed (starts with bcrypt prefix)
        if password.startswith('$2b$') or password.startswith('$2a$'):
            hashed_password = password
        else:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Check if user should be marked as verified
        is_verified_status = False
        otp_mode = os.getenv("OTP_MODE", "development").lower()
        if otp_mode == "development":
            is_verified_status = True
        else:
            from backend.models.otp_verification import OTPVerification
            record = OTPVerification.query.filter(
                (OTPVerification.email == email)
            ).filter_by(is_verified=True).first()
            if record:
                is_verified_status = True
                
        user = UserModel(
            full_name=name,
            email=email,
            password_hash=hashed_password,
            phone=mobile,
            is_blocked=False,
            is_admin=is_admin,
            email_verified=is_verified_status
        )
        db.session.add(user)
        db.session.commit()
        
        # Add Address
        addr = DeliveryAddress(user_id=user.id, is_default=True)
        if address:
            addr.house_number = address.get("house_number", "")
            addr.building_name = address.get("building_name", "")
            addr.street = address.get("street", "") or address.get("address", "")
            addr.area = address.get("area", "")
            addr.landmark = address.get("landmark", "")
            addr.city = address.get("city", "")
            addr.state = address.get("state", "")
            addr.pincode = address.get("pincode", "")
            addr.address_type = address.get("address_type", "Home")
        db.session.add(addr)
        
        # Initialize empty Cart
        cart = Cart(user_id=user.id)
        db.session.add(cart)
        
        db.session.commit()
        return user.to_dict()

    @staticmethod
    def find_by_email(email):
        from sqlalchemy.orm import selectinload, joinedload
        user = UserModel.query.options(
            selectinload(UserModel.addresses),
            selectinload(UserModel.wishlist_items).joinedload(Wishlist.product),
            selectinload(UserModel.cart).selectinload(Cart.items).joinedload(CartItem.product)
        ).filter_by(email=email).first()
        return user.to_dict() if user else None

    @staticmethod
    def find_by_id(user_id):
        try:
            uid = int(user_id)
            from sqlalchemy.orm import selectinload, joinedload
            user = UserModel.query.options(
                selectinload(UserModel.addresses),
                selectinload(UserModel.wishlist_items).joinedload(Wishlist.product),
                selectinload(UserModel.cart).selectinload(Cart.items).joinedload(CartItem.product)
            ).get(uid)
            return user.to_dict() if user else None
        except Exception:
            return None

    @staticmethod
    def verify_password(stored_password, provided_password):
        return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))

    @staticmethod
    def update_cart(user_id, cart_items, commit=True):
        try:
            uid = int(user_id)
            user = UserModel.query.with_for_update().get(uid)
            if not user:
                return False
            
            cart = user.cart
            if not cart:
                cart = Cart(user_id=uid)
                db.session.add(cart)
                db.session.flush()
                
            CartItem.query.filter_by(cart_id=cart.id, saved_for_later=False).delete()
            
            for item in cart_items:
                prod_id = int(item.get("product_id"))
                qty = int(item.get("quantity", 1))
                cart_item = CartItem(cart_id=cart.id, product_id=prod_id, quantity=qty, saved_for_later=False)
                db.session.add(cart_item)
                
            if commit:
                db.session.commit()
            else:
                db.session.flush()
            return True
        except Exception as e:
            print("Error updating cart:", e)
            if commit:
                db.session.rollback()
                return False
            raise e

    @staticmethod
    def update_wishlist(user_id, wishlist_items, commit=True):
        try:
            uid = int(user_id)
            user = UserModel.query.with_for_update().get(uid)
            if not user:
                return False
            
            Wishlist.query.filter_by(user_id=uid).delete()
            
            for item in wishlist_items:
                prod_id_str = item.get("product_id") or item.get("_id") or item.get("id")
                if prod_id_str:
                    prod_id = int(prod_id_str)
                    wish = Wishlist(user_id=uid, product_id=prod_id)
                    db.session.add(wish)
                    
            if commit:
                db.session.commit()
            else:
                db.session.flush()
            return True
        except Exception as e:
            print("Error updating wishlist:", e)
            if commit:
                db.session.rollback()
                return False
            raise e

    @staticmethod
    def update_saved_for_later(user_id, saved_items, commit=True):
        try:
            uid = int(user_id)
            user = UserModel.query.with_for_update().get(uid)
            if not user:
                return False
            
            cart = user.cart
            if not cart:
                cart = Cart(user_id=uid)
                db.session.add(cart)
                db.session.flush()
                
            CartItem.query.filter_by(cart_id=cart.id, saved_for_later=True).delete()
            
            for item in saved_items:
                prod_id = int(item.get("product_id"))
                qty = int(item.get("quantity", 1))
                cart_item = CartItem(cart_id=cart.id, product_id=prod_id, quantity=qty, saved_for_later=True)
                db.session.add(cart_item)
                
            if commit:
                db.session.commit()
            else:
                db.session.flush()
            return True
        except Exception as e:
            print("Error updating saved for later:", e)
            if commit:
                db.session.rollback()
                return False
            raise e

    @staticmethod
    def toggle_block_user(user_id, is_blocked):
        try:
            uid = int(user_id)
            user = UserModel.query.with_for_update().get(uid)
            if user:
                user.is_blocked = bool(is_blocked)
                db.session.commit()
                return True
            return False
        except Exception:
            db.session.rollback()
            return False

    @staticmethod
    def update_profile(user_id, name, email, mobile, address):
        try:
            uid = int(user_id)
            user = UserModel.query.with_for_update().get(uid)
            if not user:
                return False
            
            user.name = name
            user.email = email
            user.mobile = mobile
            
            addr = user.address
            if not addr:
                addr = DeliveryAddress(user_id=uid, is_default=True)
                db.session.add(addr)
            
            if address:
                addr.house_number = address.get("house_number", "")
                addr.building_name = address.get("building_name", "")
                addr.street = address.get("street", "") or address.get("address", "")
                addr.area = address.get("area", "")
                addr.landmark = address.get("landmark", "")
                addr.city = address.get("city", "")
                addr.state = address.get("state", "")
                addr.pincode = address.get("pincode", "")
                addr.address_type = address.get("address_type", "Home")
                addr.alternate_mobile_number = address.get("alternate_mobile_number") if address.get("alternate_mobile_number") else None
                
            db.session.commit()
            return True
        except Exception as e:
            print("Error updating profile:", e)
            db.session.rollback()
            return False

    @staticmethod
    def update_password(user_id, new_password):
        try:
            uid = int(user_id)
            user = UserModel.query.with_for_update().get(uid)
            if user:
                hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                user.password = hashed_password
                db.session.commit()
                return True
            return False
        except Exception:
            db.session.rollback()
            return False

    @staticmethod
    def find_all():
        try:
            from sqlalchemy.orm import selectinload
            users = UserModel.query.options(
                selectinload(UserModel.addresses)
            ).all()
            user_list = []
            for u in users:
                addr = u.address
                addr_dict = {
                    "id": addr.id if addr else None,
                    "house_number": addr.house_number if addr else "",
                    "building_name": addr.building_name if addr else "",
                    "street": addr.street if addr else "",
                    "area": addr.area if addr else "",
                    "landmark": addr.landmark if addr else "",
                    "city": addr.city if addr else "",
                    "state": addr.state if addr else "",
                    "pincode": addr.pincode if addr else "",
                    "address_type": addr.address_type if addr else "Home",
                    "is_default": addr.is_default if addr else False,
                    "alternate_mobile_number": addr.alternate_mobile_number if addr else ""
                }
                user_list.append({
                    "id": str(u.id),
                    "_id": str(u.id),
                    "name": u.name,
                    "email": u.email,
                    "mobile": u.mobile or "",
                    "address": addr_dict,
                    "is_blocked": bool(u.is_blocked),
                    "is_admin": bool(u.is_admin),
                    "is_verified": bool(u.is_verified),
                    "created_at": format_iso_datetime(u.created_at),
                    "last_login": format_iso_datetime(u.last_login),
                    "microsoft_id": u.microsoft_id,
                    "provider": u.provider or "local",
                    "provider_id": u.provider_id,
                    "preferred_language": u.preferred_language,
                    "first_login": bool(u.first_login),
                    "role": "admin" if u.is_admin else "customer"
                })
            return user_list
        except Exception as e:
            print("Error in find_all:", e)
            return []

    @staticmethod
    def delete_user(user_id):
        try:
            uid = int(user_id)
            user = UserModel.query.with_for_update().get(uid)
            if user:
                db.session.delete(user)
                db.session.commit()
                return True
            return False
        except Exception:
            db.session.rollback()
            return False

class UserStatusAuditLog(db.Model):
    __tablename__ = 'user_status_audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    admin_id = db.Column(db.String(100), nullable=False)
    status_changed_to = db.Column(db.String(50), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "admin_id": self.admin_id,
            "status_changed_to": self.status_changed_to,
            "reason": self.reason,
            "created_at": format_iso_datetime(self.created_at)
        }
