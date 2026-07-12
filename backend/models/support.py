from backend.extensions import db
from datetime import datetime
import pytz
from backend.utils.timezone import format_iso_datetime, get_ist_time
from backend.utils.security import EncryptedString

class SupportModel(db.Model):
    __tablename__ = 'support_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(EncryptedString(255), nullable=False)
    email = db.Column(EncryptedString(255), nullable=False)

    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='Pending')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

    def to_dict(self):
        return {
            "id": str(self.id),
            "_id": str(self.id),
            "name": self.name,
            "email": self.email,
            "message": self.message,
            "status": self.status,
            "created_at": format_iso_datetime(self.created_at),
            "replies": [r.to_dict() for r in self.replies] if hasattr(self, 'replies') else []
        }

    @staticmethod
    def create_message(name, email, message):
        try:
            msg = SupportModel(
                name=name,
                email=email,
                message=message,
                status="Pending",
                created_at=get_ist_time()
            )
            db.session.add(msg)
            db.session.commit()
            return msg.to_dict()
        except Exception as e:
            print("Error creating support message:", e)
            db.session.rollback()
            return None

    @staticmethod
    def find_all():
        try:
            from sqlalchemy.orm import selectinload
            messages = SupportModel.query.options(selectinload(SupportModel.replies)).order_by(SupportModel.created_at.desc()).all()
            return [m.to_dict() for m in messages]
        except Exception:
            return []

class FAQModel(db.Model):
    __tablename__ = 'faqs'
    
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "_id": str(self.id),
            "question": self.question,
            "answer": self.answer
        }

    @staticmethod
    def find_all():
        try:
            return FAQModel.query.order_by(FAQModel.id.asc()).all()
        except Exception:
            return []

    @staticmethod
    def create_faq(question, answer):
        try:
            faq = FAQModel(question=question, answer=answer)
            db.session.add(faq)
            db.session.commit()
            return faq.to_dict()
        except Exception as e:
            print("Error creating FAQ:", e)
            db.session.rollback()
            return None

    @staticmethod
    def update_faq(faq_id, question, answer):
        try:
            faq = FAQModel.query.with_for_update().get(faq_id)
            if faq:
                faq.question = question
                faq.answer = answer
                db.session.commit()
                return faq.to_dict()
            return None
        except Exception as e:
            print("Error updating FAQ:", e)
            db.session.rollback()
            return None

    @staticmethod
    def delete_faq(faq_id):
        try:
            faq = FAQModel.query.with_for_update().get(faq_id)
            if faq:
                db.session.delete(faq)
                db.session.commit()
                return True
            return False
        except Exception as e:
            print("Error deleting FAQ:", e)
            db.session.rollback()
            return False

class SupportLinkModel(db.Model):
    __tablename__ = 'support_links'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "_id": str(self.id),
            "title": self.title,
            "url": self.url,
            "icon": self.icon,
            "is_active": self.is_active
        }

    @staticmethod
    def find_all():
        try:
            return SupportLinkModel.query.order_by(SupportLinkModel.id.asc()).all()
        except Exception:
            return []

    @staticmethod
    def create_link(title, url, icon, is_active=True):
        try:
            link = SupportLinkModel(title=title, url=url, icon=icon, is_active=is_active)
            db.session.add(link)
            db.session.commit()
            return link.to_dict()
        except Exception as e:
            print("Error creating support link:", e)
            db.session.rollback()
            return None

    @staticmethod
    def update_link(link_id, title, url, icon, is_active):
        try:
            link = SupportLinkModel.query.with_for_update().get(link_id)
            if link:
                link.title = title
                link.url = url
                link.icon = icon
                link.is_active = is_active
                db.session.commit()
                return link.to_dict()
            return None
        except Exception as e:
            print("Error updating support link:", e)
            db.session.rollback()
            return None

    @staticmethod
    def delete_link(link_id):
        try:
            link = SupportLinkModel.query.with_for_update().get(link_id)
            if link:
                db.session.delete(link)
                db.session.commit()
                return True
            return False
        except Exception as e:
            print("Error deleting support link:", e)
            db.session.rollback()
            return False


class SupportReplyModel(db.Model):
    __tablename__ = 'support_replies'
    
    id = db.Column(db.Integer, primary_key=True)
    support_id = db.Column(db.Integer, db.ForeignKey('support_messages.id', ondelete='CASCADE'), nullable=False)
    sender = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=get_ist_time, nullable=False)

    support = db.relationship('SupportModel', backref=db.backref('replies', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            "id": self.id,
            "support_id": self.support_id,
            "sender": self.sender,
            "message": self.message,
            "created_at": format_iso_datetime(self.created_at) if self.created_at else None
        }


