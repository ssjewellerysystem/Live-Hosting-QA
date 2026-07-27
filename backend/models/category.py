from backend.extensions import db
from datetime import datetime
import pytz
from backend.utils.timezone import format_iso_datetime

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    name_en = db.Column(db.String(100), nullable=True)
    name_hi = db.Column(db.String(100), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    
    # Establish relationship to products
    products = db.relationship('ProductModel', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "_id": str(self.id),
            "name": self.name,
            "name_en": self.name_en or self.name,
            "name_hi": self.name_hi or self.name,
            "image_url": self.image_url or "",
            "created_at": format_iso_datetime(self.created_at)
        }

