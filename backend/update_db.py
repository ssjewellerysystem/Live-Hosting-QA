import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db

def run_updates():
    with app.app_context():
        # Execute ALTER TABLE queries to add columns if not exist
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses ADD COLUMN alternate_mobile_number VARCHAR(15) DEFAULT NULL"))
            db.session.commit()
            print("Successfully added alternate_mobile_number column to delivery_addresses.")
        except Exception as e:
            db.session.rollback()
            print("alternate_mobile_number column might already exist or failed:", e)

        try:
            db.session.execute(db.text("ALTER TABLE products ADD COLUMN created_by VARCHAR(255) DEFAULT 'admin'"))
            db.session.commit()
            print("Successfully added created_by column to products.")
        except Exception as e:
            db.session.rollback()
            print("created_by column might already exist or failed:", e)

        try:
            db.session.execute(db.text("ALTER TABLE products ADD COLUMN modified_by VARCHAR(255) DEFAULT 'admin'"))
            db.session.commit()
            print("Successfully added modified_by column to products.")
        except Exception as e:
            db.session.rollback()
            print("modified_by column might already exist or failed:", e)

        try:
            db.session.execute(db.text("ALTER TABLE products ADD COLUMN show_on_homepage BOOLEAN NOT NULL DEFAULT FALSE"))
            db.session.commit()
            print("Successfully added show_on_homepage column to products.")
        except Exception as e:
            db.session.rollback()
            print("show_on_homepage column might already exist or failed:", e)

        try:
            db.session.execute(db.text("ALTER TABLE users ADD COLUMN last_login DATETIME DEFAULT NULL"))
            db.session.commit()
            print("Successfully added last_login column to users.")
        except Exception as e:
            db.session.rollback()
            print("last_login column might already exist or failed:", e)

        try:
            db.session.execute(db.text("ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en'"))
            db.session.commit()
            print("Successfully added preferred_language column to users.")
        except Exception as e:
            db.session.rollback()
            print("preferred_language column might already exist or failed:", e)

        try:
            db.session.execute(db.text("ALTER TABLE users ADD COLUMN first_login BOOLEAN DEFAULT TRUE"))
            db.session.commit()
            print("Successfully added first_login column to users.")
        except Exception as e:
            db.session.rollback()
            print("first_login column might already exist or failed:", e)

        try:
            db.session.execute(db.text("ALTER TABLE categories ADD COLUMN name_en VARCHAR(100) DEFAULT NULL"))
            db.session.commit()
            print("Successfully added name_en column to categories.")
        except Exception as e:
            db.session.rollback()
            print("name_en column might already exist or failed:", e)

        try:
            db.session.execute(db.text("ALTER TABLE categories ADD COLUMN name_hi VARCHAR(100) DEFAULT NULL"))
            db.session.commit()
            print("Successfully added name_hi column to categories.")
        except Exception as e:
            db.session.rollback()
            print("name_hi column might already exist or failed:", e)

        try:
            db.session.execute(db.text("ALTER TABLE categories ADD COLUMN image_url VARCHAR(500) DEFAULT NULL"))
            db.session.commit()
            print("Successfully added image_url column to categories.")
        except Exception as e:
            db.session.rollback()
            print("image_url column might already exist or failed:", e)

        # Backpopulate translations and images for existing categories
        try:
            translations = {
                # Products (8 items)
                "Rings": {"en": "Rings", "hi": "अंगूठियाँ", "img": "/cat_rings.png"},
                "Earrings": {"en": "Earrings", "hi": "झुमके", "img": "/cat_earrings.png"},
                "Necklaces": {"en": "Necklaces", "hi": "हार", "img": "/cat_necklaces.png"},
                "Pendants": {"en": "Pendants", "hi": "लटकन", "img": "/logo.svg"},
                "Bracelets": {"en": "Bracelets", "hi": "ब्रेसलेट", "img": "/cat_bracelets.png"},
                "Bangles": {"en": "Bangles", "hi": "चूड़ियाँ", "img": "/cat_bracelets.png"},
                "Chains": {"en": "Chains", "hi": "चैन", "img": "/logo.svg"},
                "Anklets": {"en": "Anklets", "hi": "पायल", "img": "/logo.svg"},

                # Collections (14 items)
                "Bridal Collection": {"en": "Bridal Collection", "hi": "ब्राइडल कलेक्शन", "img": "/cat_bridal.png"},
                "Wedding Collection": {"en": "Wedding Collection", "hi": "वेडिंग कलेक्शन", "img": "/cat_bridal.png"},
                "Daily Wear": {"en": "Daily Wear", "hi": "डेली वियर", "img": "/cat_bracelets.png"},
                "Office Wear": {"en": "Office Wear", "hi": "ऑफिस वियर", "img": "/cat_earrings.png"},
                "Party Wear": {"en": "Party Wear", "hi": "पार्टी वियर", "img": "/cat_rings.png"},
                "Traditional Collection": {"en": "Traditional Collection", "hi": "पारंपरिक कलेक्शन", "img": "/cat_necklaces.png"},
                "Temple Jewelry": {"en": "Temple Jewelry", "hi": "टेम्पल ज्वेलरी", "img": "/cat_necklaces.png"},
                "Diamond Collection": {"en": "Diamond Collection", "hi": "डायमंड कलेक्शन", "img": "/luxury_solitaire_ring.png"},
                "Gold Collection": {"en": "Gold Collection", "hi": "गोल्ड कलेक्शन", "img": "/logo.svg"},
                "Silver Collection": {"en": "Silver Collection", "hi": "सिल्वर कलेक्शन", "img": "/logo.svg"},
                "Men's Collection": {"en": "Men's Collection", "hi": "मेंस कलेक्शन", "img": "/logo.svg"},
                "Couple Collection": {"en": "Couple Collection", "hi": "कपल कलेक्शन", "img": "/logo.svg"},
                "Festive Collection": {"en": "Festive Collection", "hi": "फेस्टिव कलेक्शन", "img": "/logo.svg"},
                "Luxury Collection": {"en": "Luxury Collection", "hi": "लक्जरी कलेक्शन", "img": "/luxury_emerald_necklace.png"}
            }
            for name, trans in translations.items():
                existing = db.session.execute(
                    db.text("SELECT id FROM categories WHERE name = :name"),
                    {"name": name}
                ).fetchone()
                if existing:
                    db.session.execute(
                        db.text("UPDATE categories SET name_en = :en, name_hi = :hi, image_url = :img WHERE name = :name"),
                        {"en": trans["en"], "hi": trans["hi"], "img": trans["img"], "name": name}
                    )
                else:
                    db.session.execute(
                        db.text("INSERT INTO categories (name, name_en, name_hi, image_url) VALUES (:name, :en, :hi, :img)"),
                        {"name": name, "en": trans["en"], "hi": trans["hi"], "img": trans["img"]}
                    )
            db.session.execute(db.text("UPDATE categories SET name_en = name WHERE name_en IS NULL"))
            db.session.execute(db.text("UPDATE categories SET image_url = '/logo.svg' WHERE image_url IS NULL"))
            db.session.commit()
            print("Successfully seeded all 22 product types and collections.")
        except Exception as e:
            db.session.rollback()
            print("Failed to seed categories and collections:", e)


        # Import all models to ensure they are registered with SQLAlchemy metadata
        from backend.models.product import ProductModel, ProductImageModel, StockHistoryModel, ProductAuditLogModel, ProductVariantModel, BuyRequestModel
        from backend.models.user import UserModel, DeliveryAddress, UserStatusAuditLog
        from backend.models.category import Category
        from backend.models.order import OrderModel, OrderItem, Transaction
        from backend.models.review import ReviewModel
        from backend.models.support import SupportModel, FAQModel, SupportLinkModel
        from backend.models.admin import AdminModel, AdminAuditLog, AdminNotification
        from backend.models.coupon import CouponModel
        from backend.models.otp_verification import OTPVerification
        from backend.models.banner import BannerModel
        from backend.models.notification import NotificationModel
        from backend.models.settings import SiteSettingModel

        # Create all tables (will create product_audit_logs, user_status_audit_logs, site_settings)
        db.create_all()
        print("db.create_all() executed successfully.")

        # Seed default site settings
        try:
            import json
            default_settings = {
                "owner_image": "/owner.png",
                "owner_name": "Shri Suresh Soni",
                "owner_title": "Founder & Master Craftsman",
                "owner_est": "Est. 1999 · Jaipur, India",
                "owner_bio_1": "With over 25 years of dedication to the ancient art of Indian jewellery, Shri Suresh Soni has transformed SS Jewellery into a hallmark of excellence trusted by families across India.",
                "owner_bio_2": "A third-generation goldsmith trained in the royal ateliers of Jaipur, he brings Kundan, Meenakari, and Jadau traditions into every handcrafted piece — blending timeless heritage with contemporary elegance.",
                "owner_quote": "Every jewel we craft carries a piece of our soul — because true luxury is not just about gold, it is about the love and legacy it carries forever.",
                "video_showcase_url": "/golden-stage.mp4",
                "luxury_gallery_items": json.dumps([
                    {
                        "id": 1,
                        "title": "Imperial Emerald & Gold Choker",
                        "description": "Exquisite 22k gold choker adorned with handpicked Zambian emeralds, South Sea pearls, and intricate Kundan detailing.",
                        "image": "/luxury_emerald_necklace.png",
                        "link": "/?category=Necklaces"
                    },
                    {
                        "id": 2,
                        "title": "The Royal Polki Bridal Set",
                        "description": "A magnificent heirloom bridal collection featuring uncut diamonds, raw rubies, and premium Meenakari artistry.",
                        "image": "/luxury_bridal_set.png",
                        "link": "/?category=Bridal%20Collection"
                    },
                    {
                        "id": 3,
                        "title": "Dazzling Solitaire Diamond Ring",
                        "description": "A breathtaking 3-carat certified diamond solitaire set in a refined 18k white gold and platinum band.",
                        "image": "/luxury_solitaire_ring.png",
                        "link": "/?category=Rings"
                    }
                ]),
                "owner_stats": json.dumps([
                    {"label": "Years of Craft", "value": 25, "suffix": "+"},
                    {"label": "Unique Designs", "value": 1200, "suffix": "+"},
                    {"label": "Happy Clients", "value": 8500, "suffix": "+"},
                    {"label": "Awards Won", "value": 18, "suffix": ""}
                ]),
                "owner_badges": json.dumps([
                    "BIS Hallmark Certified",
                    "ISO 9001:2015",
                    "Rajasthan Ratna Awardee",
                    "GIA Member"
                ]),
                "occasion_items_en": json.dumps([
                    {
                        "id": 1,
                        "title": "Date Night",
                        "subtitle": "Elegance & Layered Statements",
                        "image": "/cat_necklaces.png",
                        "description": "Perfect combinations of layered gold chains, subtle collar necklaces, and delicate hoops. Crafted to make statement memories under candlelit tables.",
                        "tips": ["Pair with solid dark necklines to highlight gold textures.", "Layer 2-3 chains of varying lengths.", "Keep earrings minimal if layering necklaces."]
                    },
                    {
                        "id": 2,
                        "title": "Wedding Wear",
                        "subtitle": "Regal Heritage Kundan",
                        "image": "/cat_bridal.png",
                        "description": "Ornate traditional bridal choker sets, heavy designer jhumkas, and matching hand ornaments. Tailored for classic royal elegance.",
                        "tips": ["Complement heavily embroidered outfits with choker-length sets.", "Style with matching maang-tika for classic look.", "Incorporate natural pearls for color balance."]
                    },
                    {
                        "id": 3,
                        "title": "Office Wear",
                        "subtitle": "Minimalistic Luxury Studs",
                        "image": "/cat_earrings.png",
                        "description": "Chic, lightweight, and modern daily-wear items. Understated solitaire bands, studs, and sleek bracelets designed for executive confidence.",
                        "tips": ["Stick to one key statement piece (e.g. sleek studs or minimalist watch).", "Platinum/white-gold options work best with formal suits.", "Avoid noisy jingling bracelets."]
                    },
                    {
                        "id": 4,
                        "title": "Daily Wear",
                        "subtitle": "Versatile Chic Bangles",
                        "image": "/cat_bracelets.png",
                        "description": "Comfortable, durable, yet elegant gold bands and bracelets. Built for regular wear while retaining luxurious gold textures.",
                        "tips": ["Mix different gold karats for unique color play.", "Opt for smooth, snag-free lock styles.", "Great for layering alongside wristwatches."]
                    }
                ]),
                "occasion_items_hi": json.dumps([
                    {
                        "id": 1,
                        "title": "डिनर डेट",
                        "subtitle": "लालित्य और लेयर्ड आभूषण",
                        "image": "/cat_necklaces.png",
                        "description": "लेयर्ड सोने की जंजीरों, सूक्ष्म कॉलर हार और नाजुक हुप्स का सही संयोजन। मोमबत्ती की रोशनी में सुखद यादें बनाने के लिए डिज़ाइन किया गया।",
                        "tips": ["सोने की बनावट को उभारने के लिए गहरे रंग के कपड़ों के साथ पहनें।", "अलग-अलग लंबाई की 2-3 चेन लेयर करें।", "हार लेयर करते समय झुमके हल्के रखें।"]
                    },
                    {
                        "id": 2,
                        "title": "शादी विवाह",
                        "subtitle": "शाही विरासत कुंदन",
                        "image": "/cat_bridal.png",
                        "description": "कढ़ाई वाले परिधानों के साथ चोकर-लंबाई वाले सेट पहनें। क्लासिक लुक के लिए मांग-टीका के साथ स्टाइल करें।",
                        "tips": ["कढ़ाई वाले परिधानों के साथ चोकर-लंबाई वाले सेट पहनें।", "क्लासिक लुक के लिए मांग-टीका के साथ स्टाइल करें।", "रंग संतुलन के लिए प्राकृतिक मोतियों को शामिल करें।"]
                    },
                    {
                        "id": 3,
                        "title": "ऑफिस वियर",
                        "subtitle": "न्यूनतम लक्जरी स्टड्स",
                        "image": "/cat_earrings.png",
                        "description": "ठाठ, हल्के और आधुनिक दैनिक-पहनने वाले आभूषण। कार्यकारी आत्मविश्वास के लिए सुरुचिपूर्ण सॉलिटेयर रिंग, स्टड्स और चिकनी ब्रेसलेट।",
                        "tips": ["एक प्रमुख आभूषण पहनें (जैसे सूक्ष्म स्टड्स या न्यूनतम ब्रेसलेट)।", "औपचारिक सूट के साथ सफेद सोना/प्लैटिनम सबसे अच्छे लगते हैं।", "आवाज करने वाले कंगन पहनने से बचें।"]
                    },
                    {
                        "id": 4,
                        "title": "दैनिक पहनावा",
                        "subtitle": "बहुमुखी ब्रेसलेट",
                        "image": "/cat_bracelets.png",
                        "description": "आरामदायक, टिकाऊ, फिर भी सुरुचिपूर्ण सोने के छल्ले और कंगन। शानदार बनावट के साथ नियमित रूप से पहनने के लिए उपयुक्त।",
                        "tips": ["अनोखे लुक के लिए सोने के विभिन्न रंगों को मिलाएं।", "स्मूथ और सुरक्षित लॉक स्टाइल चुनें।", "कलाई घड़ी के साथ लेयरिंग के लिए बेहतरीन।"]
                    }
                ]),
                "owners_list": json.dumps([
                    {
                        "id": 1,
                        "name": "Shri Suresh Soni",
                        "title": "Founder & Master Craftsman",
                        "est": "Est. 1999 · Jaipur, India",
                        "bio1": "With over 25 years of dedication to the ancient art of Indian jewellery, Shri Suresh Soni has transformed SS Jewellery into a hallmark of excellence trusted by families across India.",
                        "bio2": "A third-generation goldsmith trained in the royal ateliers of Jaipur, he brings Kundan, Meenakari, and Jadau traditions into every handcrafted piece — blending timeless heritage with contemporary elegance.",
                        "quote": "Every jewel we craft carries a piece of our soul — because true luxury is not just about gold, it is about the love and legacy it carries forever.",
                        "image": "/owner.png",
                        "stats": [
                            {"label": "Years of Craft", "value": 25, "suffix": "+"},
                            {"label": "Unique Designs", "value": 1200, "suffix": "+"},
                            {"label": "Happy Clients", "value": 8500, "suffix": "+"},
                            {"label": "Awards Won", "value": 18, "suffix": ""}
                        ],
                        "badges": ["BIS Hallmark Certified", "ISO 9001:2015", "Rajasthan Ratna Awardee", "GIA Member"]
                    }
                ])
            }
            for key, val in default_settings.items():
                existing = SiteSettingModel.query.filter_by(key=key).first()
                if not existing:
                    setting = SiteSettingModel(key=key, value=val)
                    db.session.add(setting)
            db.session.commit()
            print("Successfully seeded site settings.")
        except Exception as e:
            db.session.rollback()
            print("Failed to seed site settings:", e)

if __name__ == '__main__':
    run_updates()

