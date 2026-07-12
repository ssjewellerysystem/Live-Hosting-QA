from backend.extensions import db
from datetime import datetime
import pytz
from backend.utils.timezone import format_iso_datetime

class BannerModel(db.Model):
    __tablename__ = 'banners'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    subtitle = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    button_text = db.Column(db.String(100), nullable=True)
    button_link = db.Column(db.String(255), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    background_style = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(100), nullable=True)
    display_order = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')), onupdate=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "subtitle": self.subtitle or "",
            "description": self.description or "",
            "button_text": self.button_text or "",
            "button_link": self.button_link or "",
            "image_url": self.image_url or "",
            "background_style": self.background_style or "from-slate-900 via-indigo-950 to-slate-900",
            "category": self.category or "",
            "display_order": self.display_order,
            "is_active": self.is_active,
            "created_at": format_iso_datetime(self.created_at) if self.created_at else None,
            "updated_at": format_iso_datetime(self.updated_at) if self.updated_at else None
        }
