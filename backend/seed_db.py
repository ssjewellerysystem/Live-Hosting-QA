import os
import sys
import bcrypt
from datetime import datetime

# Set up project path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db
from backend.models.user import UserModel, DeliveryAddress
from backend.models.product import ProductModel, CategoryAttributeModel
from backend.models.coupon import CouponModel
from backend.models.category import Category
from backend.models.order import OrderModel, OrderItem, Transaction
from backend.models.review import ReviewModel
from backend.models.support import SupportModel, FAQModel, SupportLinkModel
from backend.routes.support import ensure_faqs_seeded, ensure_support_links_seeded
from backend.models.otp_verification import OTPVerification
from backend.models.admin import AdminModel
from backend.models.banner import BannerModel

def seed_database():
    print("Initiating SSJewellery Database Seeding (SQLAlchemy)...")
    
    with app.app_context():
        # Clear existing data in correct dependency order to avoid foreign key violations
        # [DISABLED per user request to prevent automatic database truncation. Run these statements manually if needed:]
        # print("Clearing old records from tables...")
        # try:
        #     db.session.query(CategoryAttributeModel).delete()
        #     db.session.query(OrderItem).delete()
        #     db.session.query(Transaction).delete()
        #     db.session.query(OrderModel).delete()
        #     db.session.query(ReviewModel).delete()
        #     from backend.models.support import SupportReplyModel
        #     db.session.query(SupportReplyModel).delete()
        #     db.session.query(SupportModel).delete()
        #     db.session.query(FAQModel).delete()
        #     db.session.query(SupportLinkModel).delete()
        #     db.session.query(OTPVerification).delete()
        #     db.session.query(CouponModel).delete()
        #     db.session.query(ProductModel).delete()
        #     db.session.query(Category).delete()
        #     db.session.query(DeliveryAddress).delete()
        #     db.session.query(UserModel).delete()
        #     db.session.query(AdminModel).delete()
        #     db.session.query(BannerModel).delete()
        #     db.session.commit()
        #     print("Successfully cleared all tables.")
        # except Exception as e:
        #     print("Warning while clearing tables:", e)
        #     db.session.rollback()

        # Seed FAQs and Support Links
        print("Seeding support links and FAQs...")
        ensure_faqs_seeded()
        ensure_support_links_seeded()

        # 1. Seed Users and Admins
        print("Seeding Users and Admin accounts...")
        admin_email = "admin@SSJewellery.com"
        admin_pw_hash = bcrypt.hashpw("Admin@123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin_user = UserModel(
            name="SSJewellery Admin",
            email=admin_email,
            password=admin_pw_hash,
            mobile="9876543210",
            is_admin=True,
            is_blocked=False,
            email_verified=True
        )
        db.session.add(admin_user)
        db.session.commit()
        
        # Seed DeliveryAddress for Admin
        admin_addr = DeliveryAddress(
            user_id=admin_user.id,
            street="100 SSJewellery Boutique, UB City",
            city="Bengaluru",
            state="Karnataka",
            pincode="560001"
        )
        db.session.add(admin_addr)
        db.session.commit()
        
        # Seed AdminModel table credentials
        admin_cred = AdminModel(
            username="admin",
            password="admin123"
        )
        db.session.add(admin_cred)
        db.session.commit()
        print(f"Created default Admin user: {admin_email} / Admin@123")

        cust_email = "customer@SSJewellery.com"
        cust_pw_hash = bcrypt.hashpw("Customer@123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cust_user = UserModel(
            name="Rahul Sharma",
            email=cust_email,
            password=cust_pw_hash,
            mobile="9123456789",
            is_admin=False,
            is_blocked=False,
            email_verified=True
        )
        db.session.add(cust_user)
        db.session.commit()
        
        cust_addr = DeliveryAddress(
            user_id=cust_user.id,
            street="45 Golf Links Apartments",
            city="New Delhi",
            state="Delhi",
            pincode="110003"
        )
        db.session.add(cust_addr)
        db.session.commit()
        print(f"Created default Customer user: {cust_email} / Customer@123")

        # 2. Seed Products
        print("Seeding catalog products...")
        mock_products = []
        for p in mock_products:
            ProductModel.create_product(p)
        print(f"Successfully seeded {len(mock_products)} premium catalog products!")

        # 3. Seed Coupons
        print("Seeding default coupons...")
        default_coupons = [
            {
                "code": "GOLDEN10",
                "discount_type": "percent",
                "discount_value": 10.0,
                "min_order_amount": 10000.0,
                "is_active": True
            },
            {
                "code": "ROYAL5000",
                "discount_type": "flat",
                "discount_value": 5000.0,
                "min_order_amount": 50000.0,
                "is_active": True
            },
            {
                "code": "LUXURY50",
                "discount_type": "percent",
                "discount_value": 50.0,
                "min_order_amount": 100000.0,
                "is_active": True
            }
        ]
        for c in default_coupons:
            CouponModel.create_coupon(
                code=c["code"],
                discount_type=c["discount_type"],
                discount_value=c["discount_value"],
                min_order_amount=c["min_order_amount"],
                is_active=c["is_active"]
            )
        print("Successfully seeded coupons.")

        # 4. Seed Category Attributes
        print("Seeding category attributes...")
        category_attributes = [
            # Rings
            {"category": "Rings", "attribute": "Ring Size", "value": "5"},
            {"category": "Rings", "attribute": "Ring Size", "value": "6"},
            {"category": "Rings", "attribute": "Ring Size", "value": "7"},
            {"category": "Rings", "attribute": "Ring Size", "value": "8"},
            {"category": "Rings", "attribute": "Ring Size", "value": "9"},
            {"category": "Rings", "attribute": "Metal", "value": "18k Yellow Gold"},
            {"category": "Rings", "attribute": "Metal", "value": "18k White Gold"},
            {"category": "Rings", "attribute": "Metal", "value": "18k Rose Gold"},
            {"category": "Rings", "attribute": "Metal", "value": "Platinum"},
            {"category": "Rings", "attribute": "Clarity", "value": "VVS1"},
            {"category": "Rings", "attribute": "Clarity", "value": "VS1"},

            # Necklaces
            {"category": "Necklaces", "attribute": "Length", "value": "16 inches"},
            {"category": "Necklaces", "attribute": "Length", "value": "18 inches"},
            {"category": "Necklaces", "attribute": "Length", "value": "20 inches"},
            {"category": "Necklaces", "attribute": "Metal", "value": "18k Yellow Gold"},
            {"category": "Necklaces", "attribute": "Metal", "value": "18k White Gold"},
            {"category": "Necklaces", "attribute": "Metal", "value": "22k Yellow Gold"},

            # Earrings
            {"category": "Earrings", "attribute": "Style", "value": "Studs"},
            {"category": "Earrings", "attribute": "Style", "value": "Hoops"},
            {"category": "Earrings", "attribute": "Style", "value": "Drop Earrings"},
            {"category": "Earrings", "attribute": "Metal", "value": "18k Yellow Gold"},
            {"category": "Earrings", "attribute": "Metal", "value": "18k White Gold"},

            # Bracelets
            {"category": "Bracelets", "attribute": "Size", "value": "6.5 inches"},
            {"category": "Bracelets", "attribute": "Size", "value": "7.0 inches"},
            {"category": "Bracelets", "attribute": "Size", "value": "7.5 inches"},
            {"category": "Bracelets", "attribute": "Metal", "value": "18k White Gold"},
            {"category": "Bracelets", "attribute": "Metal", "value": "18k Yellow Gold"},

            # Bangles
            {"category": "Bangles", "attribute": "Inner Diameter", "value": "2.4 (2.25\")"},
            {"category": "Bangles", "attribute": "Inner Diameter", "value": "2.6 (2.37\")"},
            {"category": "Bangles", "attribute": "Inner Diameter", "value": "2.8 (2.50\")"},
            {"category": "Bangles", "attribute": "Metal", "value": "22k Yellow Gold"},

            # Bridal Collection
            {"category": "Bridal Collection", "attribute": "Metal", "value": "22k Gold (Polki)"},
            {"category": "Bridal Collection", "attribute": "Metal", "value": "18k White Gold"},
        ]
        for attr in category_attributes:
            cat = Category.query.filter_by(name=attr["category"]).first()
            new_attr = CategoryAttributeModel(
                category_id=cat.id if cat else None,
                category_name=attr["category"],
                attribute_name=attr["attribute"],
                attribute_value=attr["value"]
            )
            db.session.add(new_attr)
        db.session.commit()
        print("Successfully seeded category attributes.")

        # 5. Seed Banners
        print("Seeding banners...")
        default_banners = [
            {
                "title": "The Solitaire Diamond Collection",
                "subtitle": "Eternal Brilliance, Handcrafted Elegance",
                "description": "Explore our signature 18k yellow gold and white gold diamond solitaire rings. Perfect for weddings, proposals, and lifetime memories.",
                "button_text": "Shop Solitaires",
                "button_link": "/?category=Rings",
                "image_url": "",
                "background_style": "from-[#3F1D5A] via-[#2C143F] to-[#1B0B26]",
                "category": "Rings",
                "display_order": 1,
                "is_active": True
            },
            {
                "title": "The Royal Empress Collection",
                "subtitle": "Ornate Emerald & Pearl Artistry",
                "description": "Adorn yourself with masterfully crafted necklaces, chokers, and bridal neckwear set in solid 22k gold and premium gemstones.",
                "button_text": "Shop Necklaces",
                "button_link": "/?category=Necklaces",
                "image_url": "",
                "background_style": "from-[#3F1D5A] via-[#5C2E7E] to-[#3F1D5A]",
                "category": "Necklaces",
                "display_order": 2,
                "is_active": True
            },
            {
                "title": "Imperial Bridal Heirlooms",
                "subtitle": "Maang Tikkas, Polki Sets & Rubies",
                "description": "Celebrate your grand day with timeless heirloom bridal sets, meticulously set with uncut Polki diamonds and fine rubies.",
                "button_text": "Explore Bridal Set",
                "button_link": "/?category=Bridal%20Collection",
                "image_url": "",
                "background_style": "from-[#1B0B26] via-[#3F1D5A] to-[#1B0B26]",
                "category": "Bridal Collection",
                "display_order": 3,
                "is_active": True
            }
        ]
        for b_data in default_banners:
            b = BannerModel(
                title=b_data["title"],
                subtitle=b_data["subtitle"],
                description=b_data["description"],
                button_text=b_data["button_text"],
                button_link=b_data["button_link"],
                image_url=b_data["image_url"],
                background_style=b_data["background_style"],
                category=b_data["category"],
                display_order=b_data["display_order"],
                is_active=b_data["is_active"]
            )
            db.session.add(b)
        db.session.commit()
        print("Successfully seeded banners.")
        print("Database seeding completed successfully.")

if __name__ == '__main__':
    seed_database()
