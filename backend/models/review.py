from backend.extensions import db
from datetime import datetime
import pytz
from backend.utils.timezone import format_iso_datetime, get_ist_time

class ReviewModel(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    user_name = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

    def to_dict(self):
        return {
            "id": str(self.id),
            "_id": str(self.id),
            "product_id": str(self.product_id),
            "user_id": str(self.user_id) if self.user_id else None,
            "user_name": self.user_name,
            "rating": int(self.rating),
            "comment": self.comment or "",
            "created_at": format_iso_datetime(self.created_at)
        }


    @staticmethod
    def create_review(product_id, user_name, rating, comment):
        try:
            p_id = int(product_id)
            review = ReviewModel(
                product_id=p_id,
                user_name=user_name,
                rating=int(rating),
                comment=comment,
                created_at=get_ist_time()
            )
            db.session.add(review)
            db.session.commit()
            
            # Proactively recalculate product rating
            ReviewModel.recalculate_product_rating(p_id)
            
            return review.to_dict()
        except Exception as e:
            print("Error creating review:", e)
            db.session.rollback()
            return None

    @staticmethod
    def find_by_product_id(product_id):
        try:
            p_id = int(product_id)
            reviews = ReviewModel.query.filter_by(product_id=p_id).order_by(ReviewModel.created_at.desc()).all()
            return [r.to_dict() for r in reviews]
        except Exception:
            return []

    @staticmethod
    def recalculate_product_rating(product_id):
        try:
            p_id = int(product_id)
            reviews = ReviewModel.query.filter_by(product_id=p_id).all()
            if not reviews:
                return
                
            total_rating = sum(r.rating for r in reviews)
            avg_rating = round(total_rating / len(reviews), 1)
            
            from backend.models.product import ProductModel
            product = ProductModel.query.get(p_id)
            if product:
                product.ratings = avg_rating
                db.session.commit()
        except Exception as e:
            print(f"Error recalculating rating: {e}")
            db.session.rollback()
