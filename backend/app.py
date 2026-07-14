import os
import sys

# Add parent directory to sys.path to enable backend package resolution
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load configuration first
load_dotenv()

# Global safe print patch to prevent OSError [Errno 5] Input/output error
# when running in background with closed standard streams
import builtins
import sys
_original_print = builtins.print
def safe_print(*args, **kwargs):
    try:
        _original_print(*args, **kwargs)
    except Exception:
        try:
            sys.stderr.write(" ".join(map(str, args)) + "\n")
            sys.stderr.flush()
        except Exception:
            pass
builtins.print = safe_print

from backend.extensions import db, migrate, mail
from backend.config import Config
from backend.routes.auth import auth_bp
from backend.routes.products import products_bp
from backend.routes.orders import orders_bp
from backend.routes.admin import admin_bp
from backend.routes.support import support_bp
from backend.routes.coupons import coupons_bp
from backend.routes.banners import banners_bp

app = Flask(__name__)
# Load configuration
app.config.from_object(Config)

# Enable CORS for frontend requests
CORS(app)

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)
mail.init_app(app)

# Register API blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(products_bp, url_prefix='/api/products')
app.register_blueprint(orders_bp, url_prefix='/api/orders')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(support_bp, url_prefix='/api/support')
app.register_blueprint(coupons_bp, url_prefix='/api/coupons')
app.register_blueprint(banners_bp, url_prefix='/api/banners')

from flask import request
from backend.utils.helpers import generate_otp, verify_otp, is_valid_email
from backend.models.user import UserModel

@app.route('/api/send-otp', methods=['POST'])
def root_send_otp():
    data = request.get_json() or {}
    identifier = data.get("identifier") or data.get("mobile") or data.get("email")
    if not identifier:
        return jsonify({"message": "Please provide identifier, mobile, or email.", "success": False}), 400
        
    otp = generate_otp(identifier)
    
    # Placeholder for MSG91 / real SMS service integration
    # When switching to production later, replace this print/email flow with actual MSG91 SDK call
    print(f"\n[PRODUCTION PLACEMENT] Future MSG91 would send OTP {otp} to {identifier}\n")
    
    # If it is email, we can also email it (as in auth/send-otp)
    if is_valid_email(identifier):
        try:
            from backend.utils.email_service import send_email
            subject = "Your SSJewellery Verification Code"
            body_html = f"""
            <html>
                <body>
                    <h2>Verification Code</h2>
                    <p>Hello,</p>
                    <p>Your OTP verification code for SSJewellery is: <strong>{otp}</strong></p>
                    <p>This code will expire in 5 minutes.</p>
                    <p>Thank you for shopping with us!</p>
                </body>
            </html>
            """
            send_email(identifier, subject, body_html)
        except Exception as e:
            print("Failed to send email OTP:", e)
            
    response_data = {
        "message": "OTP sent successfully! Please check your console or email.",
        "success": True
    }
    if os.getenv("OTP_MODE", "development").lower() == "development":
        response_data["otp_debug"] = otp
    return jsonify(response_data), 200

@app.route('/api/verify-otp', methods=['POST'])
def root_verify_otp():
    data = request.get_json() or {}
    identifier = data.get("identifier") or data.get("mobile") or data.get("email")
    otp = data.get("otp")
    
    if not identifier or not otp:
        return jsonify({"message": "Please provide both identifier/mobile/email and OTP.", "success": False}), 400
        
    success = verify_otp(identifier, otp)
    if not success:
        return jsonify({"message": "Invalid or expired OTP. Please try again.", "success": False}), 400
        
    # Mark user as verified if they exist
    user = UserModel.query.filter((UserModel.mobile == identifier) | (UserModel.email == identifier)).first()
    if user:
        try:
            user.is_verified = True
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print("Failed to update user is_verified status:", e)
            
    return jsonify({
        "message": "OTP verified successfully!",
        "success": True
    }), 200

# Ensure static upload directory is served
@app.route('/static/uploads/<path:filename>')
def serve_uploads(filename):
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
    from flask import send_from_directory
    return send_from_directory(upload_dir, filename)

@app.errorhandler(404)
def not_found(error):
    return jsonify({"message": "API endpoint not found!"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"message": f"Internal server error: {str(error)}"}), 500

def seed_database():
    """
    Seeds initial products and coupons if they are empty in the database.
    """
    from backend.models.product import ProductModel
    from backend.models.coupon import CouponModel
    from backend.extensions import db
    
    try:
        # Check if there are any old categories in the database
        from backend.models.category import Category
        old_categories = ["Electronics", "Fashion", "Grocery", "Books", "Home & Kitchen", "Home Decor"]
        has_old_categories = False
        for old_cat in old_categories:
            if ProductModel.query.join(Category).filter(Category.name == old_cat).count() > 0:
                has_old_categories = True
                break
        
        if ProductModel.query.count() == 0:
            print("[SEED] Seeding default luxury jewelry products into MySQL...")
            # ProductModel.query.delete() -- DISABLED to prevent automatic truncation of data.
            # db.session.commit() -- DISABLED to prevent automatic truncation of data.
            
            default_products = []
            for p in default_products:
                ProductModel.create_product(p)
            print("[SEED] Successfully seeded luxury jewelry products.")
        else:
            print("[SEED] Products already exist. Skipping seed.")
            
        if CouponModel.query.count() == 0:
            print("[SEED] Seeding default coupons into MySQL...")
            default_coupons = [
                {
                    "code": "WELCOME10",
                    "discount_type": "percent",
                    "discount_value": 10.0,
                    "min_order_amount": 500.0,
                    "is_active": True
                },
                {
                    "code": "FLAT200",
                    "discount_type": "flat",
                    "discount_value": 200.0,
                    "min_order_amount": 1500.0,
                    "is_active": True
                },
                {
                    "code": "BASKET50",
                    "discount_type": "percent",
                    "discount_value": 50.0,
                    "min_order_amount": 5000.0,
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
            print("[SEED] Successfully seeded coupons.")
        else:
            print("[SEED] Coupons already exist. Skipping seed.")
            
        # Seed default banners if empty
        from backend.models.banner import BannerModel
        # Check if there are any old categories in banners
        has_old_banners = False
        old_banner_categories = ["Electronics", "Fashion", "Grocery", "Books", "Home & Kitchen", "Home Decor"]
        for old_cat in old_banner_categories:
            if BannerModel.query.filter_by(category=old_cat).count() > 0:
                has_old_banners = True
                break
        if BannerModel.query.filter(BannerModel.title.like("%BharatBasket%")).count() > 0 or BannerModel.query.filter(BannerModel.title.like("%SSJewelry%")).count() > 0:
            has_old_banners = True
            
        if BannerModel.query.count() == 0:
            print("[SEED] Seeding default banners into MySQL...")
            # BannerModel.query.delete() -- DISABLED to prevent automatic truncation of data.
            # db.session.commit() -- DISABLED to prevent automatic truncation of data.
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
            print("[SEED] Successfully seeded banners.")
        else:
            print("[SEED] Banners already exist. Skipping seed.")
    except Exception as e:
        print("[SEED] Error seeding database:", e)

# Run initialization inside app context if db tables are initialized
# Run initialization inside app context if db tables are initialized
with app.app_context():
    db.create_all()
    seed_database()

    try:
        from backend.utils.report_automation import start_report_scheduler
        start_report_scheduler(app)
    except Exception as err:
        print("[APP] Scheduler will start after DB is ready:", err)

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
