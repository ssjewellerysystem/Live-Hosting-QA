from backend.extensions import db
from datetime import datetime
import pytz
from backend.utils.timezone import format_iso_datetime

class CollectionModel(db.Model):
    __tablename__ = 'collections'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    banner_image = db.Column(db.String(512), nullable=True)
    thumbnail_image = db.Column(db.String(512), nullable=True)
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')), onupdate=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    desktop_banner = db.Column(db.String(512), nullable=True)
    mobile_banner = db.Column(db.String(512), nullable=True)
    preview_image = db.Column(db.String(512), nullable=True)
    highlights = db.Column(db.Text, nullable=True)
    rules = db.Column(db.Text, nullable=True)
    show_on_homepage = db.Column(db.Boolean, default=True)
    subtitle = db.Column(db.String(255), nullable=True)
    styling_tips = db.Column(db.Text, nullable=True)
    image = db.Column(db.String(512), nullable=True)

    # Relationship to products
    products = db.relationship('ProductModel', backref='collection', lazy=True)

    def to_dict(self):
        img_url = self.image or self.thumbnail_image or self.preview_image or self.banner_image or ""
        
        tips = []
        if self.styling_tips:
            import json
            try:
                tips = json.loads(self.styling_tips)
            except Exception:
                tips = [t.strip() for t in self.styling_tips.split('\n') if t.strip()]

        return {
            "id": str(self.id),
            "_id": str(self.id),
            "name": self.name,
            "title": self.name,
            "slug": self.slug,
            "subtitle": self.subtitle or "",
            "description": self.description or "",
            "image": img_url,
            "image_url": img_url,
            "styling_tips": tips,
            "thumbnail_image": self.thumbnail_image or img_url,
            "banner_image": self.banner_image or img_url,
            "display_order": self.display_order if self.display_order is not None else 0,
            "is_active": self.is_active if self.is_active is not None else True,
            "created_at": format_iso_datetime(self.created_at) if self.created_at else "",
            "updated_at": format_iso_datetime(self.updated_at) if self.updated_at else ""
        }
