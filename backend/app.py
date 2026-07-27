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

import logging
from backend.extensions import db, migrate, mail
from backend.config import Config, validate_environment, FRONTEND_URL
from backend.models import TransactionModel
from backend.routes.auth import auth_bp
from backend.routes.products import products_bp
from backend.routes.orders import orders_bp
from backend.routes.admin import admin_bp
from backend.routes.support import support_bp
from backend.routes.coupons import coupons_bp
from backend.routes.banners import banners_bp
from backend.routes.collections import collections_bp
from backend.routes.gold_rate import gold_rate_bp
from backend.routes.maintenance import maintenance_bp
from backend.routes.high_demand import high_demand_bp
from backend.routes.payments import payments_bp
from backend.middleware.maintenance import check_maintenance_mode

# Run startup environment validation
validate_environment()

app = Flask(__name__)
# Load configuration
app.config.from_object(Config)

# Configure Python logging based on active environment LOGGING_LEVEL
log_level = getattr(logging, str(Config.LOGGING_LEVEL).upper(), logging.INFO)
logging.basicConfig(level=log_level, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
app.logger.setLevel(log_level)


# Enable CORS for frontend requests
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

import gzip
import io

@app.after_request
def add_cors_and_compress(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, X-Requested-With'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'

    # Gzip response payload compression for text/JSON responses
    if (
        response.status_code >= 200
        and response.status_code < 300
        and 'Content-Encoding' not in response.headers
        and not response.direct_passthrough
    ):
        accept_encoding = request.headers.get('Accept-Encoding', '')
        if 'gzip' in accept_encoding.lower():
            mimetype = response.mimetype or ''
            if any(t in mimetype for t in ['application/json', 'text/html', 'text/css', 'text/javascript', 'application/javascript']):
                response_data = response.get_data()
                if len(response_data) >= 500:
                    gzip_buffer = io.BytesIO()
                    with gzip.GzipFile(mode='wb', fileobj=gzip_buffer) as gzip_file:
                        gzip_file.write(response_data)
                    compressed_data = gzip_buffer.getvalue()
                    response.set_data(compressed_data)
                    response.headers['Content-Encoding'] = 'gzip'
                    response.headers['Content-Length'] = len(compressed_data)
                    response.headers['Vary'] = 'Accept-Encoding'

    return response

# Allow flexible trailing slashes across all blueprint routes
app.url_map.strict_slashes = False

# Register before_request maintenance middleware handler
app.before_request(check_maintenance_mode)

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)
mail.init_app(app)

# Register API blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(products_bp, url_prefix='/api/products')
app.register_blueprint(orders_bp, url_prefix='/api/orders')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(payments_bp, url_prefix='/api/admin/payments')
app.register_blueprint(support_bp, url_prefix='/api/support')
app.register_blueprint(coupons_bp, url_prefix='/api/coupons')
app.register_blueprint(banners_bp, url_prefix='/api/banners')
app.register_blueprint(collections_bp, url_prefix='/api/collections')
app.register_blueprint(gold_rate_bp, url_prefix='/api/gold-rate')
app.register_blueprint(maintenance_bp, url_prefix='/api/maintenance')
app.register_blueprint(high_demand_bp, url_prefix='/api/high-demand')


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

# Ensure static upload directory is served with long-term browser caching
@app.route('/static/uploads/<path:filename>')
def serve_uploads(filename):
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
    from flask import send_from_directory
    res = send_from_directory(upload_dir, filename)
    res.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    return res

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
            


        # Seed Collections
        from backend.models.collection import CollectionModel
        if CollectionModel.query.count() == 0:
            default_collections = [
                {
                    "name": "Wedding Wear",
                    "slug": "wedding-wear",
                    "description": "Regal Heritage Kundan bridal sets and royal elegance",
                    "thumbnail_image": None,
                    "display_order": 1
                },
                {
                    "name": "Daily Wear",
                    "slug": "daily-wear",
                    "description": "Versatile Chic Bangles and daily gold bands",
                    "thumbnail_image": None,
                    "display_order": 2
                },
                {
                    "name": "Office Wear",
                    "slug": "office-wear",
                    "description": "Minimalistic Luxury Studs and sleek executive items",
                    "thumbnail_image": None,
                    "display_order": 3
                },
                {
                    "name": "Date Night",
                    "slug": "date-night",
                    "description": "Elegance & Layered Statements under candlelit tables",
                    "thumbnail_image": None,
                    "display_order": 4
                },
                {
                    "name": "New Collection",
                    "slug": "new-collection",
                    "description": "Fresh Masterpieces & Diamond Solitaires",
                    "thumbnail_image": None,
                    "display_order": 5
                }
            ]
            for c_data in default_collections:
                coll = CollectionModel(
                    name=c_data["name"],
                    slug=c_data["slug"],
                    description=c_data["description"],
                    thumbnail_image=c_data["thumbnail_image"],
                    display_order=c_data["display_order"],
                    is_active=True
                )
                db.session.add(coll)
            db.session.commit()
            print("[SEED] Successfully seeded default collections.")
        else:
            print("[SEED] Collections already exist. Skipping seed.")
    except Exception as e:
        print("[SEED] Error seeding database:", e)


# Run initialization inside app context if db tables are initialized
with app.app_context():
    db.create_all()
    seed_database()

    try:
        from backend.utils.report_automation import start_report_scheduler
        start_report_scheduler(app)
    except Exception as err:
        print("[APP] Scheduler will start after DB is ready:", err)

    try:
        from backend.utils.gold_rate_scheduler import start_gold_rate_scheduler
        start_gold_rate_scheduler(app)
    except Exception as err:
        print("[APP] Gold rate scheduler error:", err)

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5005))
    app.run(host='0.0.0.0', port=port, debug=False)
