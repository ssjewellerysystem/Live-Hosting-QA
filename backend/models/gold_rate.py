from backend.extensions import db
from datetime import datetime

class GoldRateModel(db.Model):
    __tablename__ = 'gold_rates'

    id = db.Column(db.Integer, primary_key=True)
    metal_type = db.Column(db.String(20), default='gold', nullable=False) # 'gold' | 'silver'
    purity = db.Column(db.String(20), nullable=True)                      # '24k', '22k', '18k', '14k', '1g', '1kg'
    city = db.Column(db.String(50), default='Jaipur', nullable=False)
    state = db.Column(db.String(50), default='Rajasthan', nullable=False)
    rate_per_gram = db.Column(db.Float, nullable=True)
    price_24k = db.Column(db.Float, nullable=True)                        # Compatibility
    price_22k = db.Column(db.Float, nullable=True)                        # Compatibility
    price_18k = db.Column(db.Float, nullable=True)                        # Compatibility
    price_14k = db.Column(db.Float, nullable=True)                        # Compatibility
    usd_inr = db.Column(db.Float, nullable=True)                          # Compatibility
    currency = db.Column(db.String(10), default='INR', nullable=False)
    source = db.Column(db.String(50), default='RapidAPI', nullable=False)
    effective_date = db.Column(db.String(20), nullable=True)              # YYYY-MM-DD
    fetched_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_latest = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "metal_type": self.metal_type,
            "purity": self.purity,
            "city": self.city,
            "state": self.state,
            "rate_per_gram": self.rate_per_gram,
            "price_24k": self.price_24k,
            "price_22k": self.price_22k,
            "price_18k": self.price_18k,
            "price_14k": self.price_14k,
            "currency": self.currency,
            "source": self.source,
            "effective_date": self.effective_date,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
            "is_latest": self.is_latest,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
