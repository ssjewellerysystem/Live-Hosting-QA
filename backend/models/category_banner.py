from backend.extensions import db
from datetime import datetime
import pytz
from backend.utils.timezone import format_iso_datetime

class CategoryBanner(db.Model):
    __tablename__ = 'category_banners'

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='CASCADE'), nullable=False, unique=True)
    banner_image = db.Column(db.String(500), nullable=False)
    title = db.Column(db.String(255), nullable=True)
    subtitle = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    button_text = db.Column(db.String(100), nullable=True)
    button_link = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    display_order = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')), onupdate=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

    # Relationship to Category model
    category = db.relationship('Category', backref=db.backref('banner', uselist=False, cascade='all, delete-orphan'))

    def to_dict(self):
        cat_name = self.category.name if self.category else ""
        return {
            "id": self.id,
            "category_id": self.category_id,
            "category_name": cat_name,
            "banner_image": self.banner_image or "",
            "title": self.title or "",
            "subtitle": self.subtitle or "",
            "description": self.description or "",
            "button_text": self.button_text or "",
            "button_link": self.button_link or "",
            "status": "Active" if self.is_active else "Inactive",
            "is_active": self.is_active,
            "display_order": self.display_order,
            "created_at": format_iso_datetime(self.created_at) if self.created_at else None,
            "updated_at": format_iso_datetime(self.updated_at) if self.updated_at else None
        }
