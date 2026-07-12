import os
import sys
import logging

# Add parent directory to sys.path to enable backend package resolution
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix

# Load .env before importing config so _require() sees the variables
_root = parent_dir
load_dotenv(os.path.join(_root, ".env"), override=False)

# ── Safe print patch ──────────────────────────────────────────────────────────
# Prevents OSError [Errno 5] when stdout/stderr are closed (e.g., background daemon)
import builtins
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

# ── Application factory ───────────────────────────────────────────────────────
from backend.extensions import db, migrate, mail
from backend.config import Config, configure_logging
from backend.routes.auth import auth_bp
from backend.routes.products import products_bp
from backend.routes.orders import orders_bp
from backend.routes.admin import admin_bp
from backend.routes.support import support_bp
from backend.routes.coupons import coupons_bp
from backend.routes.banners import banners_bp

app = Flask(__name__)
app.config.from_object(Config)

# ── Structured logging ────────────────────────────────────────────────────────
configure_logging(app)
logger = logging.getLogger(__name__)

# ── Trust the Caddy reverse proxy ─────────────────────────────────────────────
app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_for=Config.PROXY_FIX_NUM_PROXIES,
    x_proto=Config.PROXY_FIX_NUM_PROXIES,
    x_host=Config.PROXY_FIX_NUM_PROXIES,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Origins come from CORS_ALLOWED_ORIGINS env var; no localhost in production.
_cors_origins = Config.CORS_ALLOWED_ORIGINS or []
CORS(app, resources={r"/api/*": {"origins": _cors_origins}})

# ── Extensions ────────────────────────────────────────────────────────────────
db.init_app(app)
migrate.init_app(app, db)
mail.init_app(app)

# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp,     url_prefix='/api/auth')
app.register_blueprint(products_bp, url_prefix='/api/products')
app.register_blueprint(orders_bp,   url_prefix='/api/orders')
app.register_blueprint(admin_bp,    url_prefix='/api/admin')
app.register_blueprint(support_bp,  url_prefix='/api/support')
app.register_blueprint(coupons_bp,  url_prefix='/api/coupons')
app.register_blueprint(banners_bp,  url_prefix='/api/banners')

# ── Core routes ───────────────────────────────────────────────────────────────
from flask import request
from backend.utils.helpers import generate_otp, verify_otp, is_valid_email
from backend.models.user import UserModel


@app.route('/health', methods=['GET'])
def health_check():
    """
    Lightweight unauthenticated health endpoint.
    Returns HTTP 200 when the application process is running.
    Does NOT expose database credentials, config values, or stack traces.
    The Docker and Caddy health checks both call this endpoint.
    """
    return jsonify({"status": "ok", "service": "ss-jewellery-backend"}), 200


@app.route('/api/send-otp', methods=['POST'])
def root_send_otp():
    data = request.get_json() or {}
    identifier = data.get("identifier") or data.get("mobile") or data.get("email")
    if not identifier:
        return jsonify({"message": "Please provide identifier, mobile, or email.", "success": False}), 400

    otp = generate_otp(identifier)

    # Placeholder for MSG91 / real SMS service integration
    logger.info("[OTP] OTP generated for identifier (not logged for security)")

    # If it is an email, send via Flask-Mail
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
            logger.error("Failed to send email OTP: %s", e)

    response_data = {
        "message": "OTP sent successfully! Please check your console or email.",
        "success": True
    }
    # Only include otp_debug in development/test environments
    if os.getenv("OTP_MODE", "production").lower() in ("development", "test"):
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

    user = UserModel.query.filter(
        (UserModel.mobile == identifier) | (UserModel.email == identifier)
    ).first()
    if user:
        try:
            user.is_verified = True
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error("Failed to update user is_verified: %s", e)

    return jsonify({"message": "OTP verified successfully!", "success": True}), 200


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
    logger.error("Internal server error: %s", error)
    return jsonify({"message": "Internal server error."}), 500


# ── DB initialisation ─────────────────────────────────────────────────────────
def seed_database():
    """Seeds initial products and coupons if the tables are empty."""
    from backend.models.product import ProductModel
    from backend.models.coupon import CouponModel
    from backend.extensions import db

    try:
        from backend.models.category import Category
        old_categories = ["Electronics", "Fashion", "Grocery", "Books", "Home & Kitchen", "Home Decor"]
        has_old_categories = any(
            ProductModel.query.join(Category).filter(Category.name == c).count() > 0
            for c in old_categories
        )

        if ProductModel.query.count() == 0:
            logger.info("[SEED] Seeding default luxury jewelry products...")
            default_products = [
                {
                    "name": "Diamond Solitaire Promise Ring",
                    "price": 45000.00,
                    "discount": 15.0,
                    "description": "An exquisite 18k yellow gold solitaire ring featuring a brilliant-cut 0.5 carat VVS1 diamond. Elegant, timeless, and crafted to perfection.",
                    "images": ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=60"],
                    "stock": 10, "category": "Rings", "ratings": 4.8
                },
                {
                    "name": "Royal Emerald Pendant Necklace",
                    "price": 85000.00,
                    "discount": 10.0,
                    "description": "A majestic 22k gold chain suspending a deep green emerald pendant, surrounded by a halo of micro-pave diamonds. A symbol of royalty and grace.",
                    "images": ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=60"],
                    "stock": 5, "category": "Necklaces", "ratings": 4.9
                },
                {
                    "name": "Diamond Hoop Earrings",
                    "price": 32000.00,
                    "discount": 12.0,
                    "description": "Crafted in 18k white gold, these sparkling hoop earrings are set with fine round diamonds, reflecting light beautifully with every movement.",
                    "images": ["https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=60"],
                    "stock": 15, "category": "Earrings", "ratings": 4.7
                },
                {
                    "name": "Golden Pearl Cuff Bracelet",
                    "price": 27500.00,
                    "discount": 8.0,
                    "description": "An elegant, adjustable gold cuff bracelet embellished with two luminous South Sea golden pearls. Perfectly blends modern style with classic luxury.",
                    "images": ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&auto=format&fit=crop&q=60"],
                    "stock": 12, "category": "Bracelets", "ratings": 4.6
                },
                {
                    "name": "Traditional Gold Filigree Bangles",
                    "price": 95000.00,
                    "discount": 5.0,
                    "description": "Exquisite pair of 22k gold bangles featuring detailed handcrafted filigree work. A traditional Indian design celebrating heritage craftsmanship.",
                    "images": ["https://images.unsplash.com/photo-1611085583191-a3b1a8a2954e?w=800&auto=format&fit=crop&q=60"],
                    "stock": 8, "category": "Bangles", "ratings": 4.9
                },
                {
                    "name": "Majestic Bridal Kundan Choker Set",
                    "price": 250000.00,
                    "discount": 20.0,
                    "description": "A breathtaking bridal choker set featuring intricate Kundan settings, uncut diamonds (Polki), and cascading emerald beads. Includes matching heavy earrings.",
                    "images": ["https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&auto=format&fit=crop&q=60"],
                    "stock": 3, "category": "Bridal Collection", "ratings": 5.0
                },
            ]
            for p in default_products:
                ProductModel.create_product(p)
            logger.info("[SEED] Successfully seeded luxury jewelry products.")
        else:
            logger.info("[SEED] Products already exist. Skipping seed.")

        if CouponModel.query.count() == 0:
            logger.info("[SEED] Seeding default coupons...")
            default_coupons = [
                {"code": "WELCOME10",  "discount_type": "percent", "discount_value": 10.0,  "min_order_amount": 500.0,  "is_active": True},
                {"code": "FLAT200",    "discount_type": "flat",    "discount_value": 200.0, "min_order_amount": 1500.0, "is_active": True},
                {"code": "BASKET50",   "discount_type": "percent", "discount_value": 50.0,  "min_order_amount": 5000.0, "is_active": True},
            ]
            for c in default_coupons:
                CouponModel.create_coupon(
                    code=c["code"],
                    discount_type=c["discount_type"],
                    discount_value=c["discount_value"],
                    min_order_amount=c["min_order_amount"],
                    is_active=c["is_active"],
                )
            logger.info("[SEED] Successfully seeded coupons.")
        else:
            logger.info("[SEED] Coupons already exist. Skipping seed.")

        from backend.models.banner import BannerModel
        if BannerModel.query.count() == 0:
            logger.info("[SEED] Seeding default banners...")
            default_banners = [
                {
                    "title": "The Solitaire Diamond Collection",
                    "subtitle": "Eternal Brilliance, Handcrafted Elegance",
                    "description": "Explore our signature 18k yellow gold and white gold diamond solitaire rings. Perfect for weddings, proposals, and lifetime memories.",
                    "button_text": "Shop Solitaires", "button_link": "/?category=Rings",
                    "image_url": "", "background_style": "from-[#3F1D5A] via-[#2C143F] to-[#1B0B26]",
                    "category": "Rings", "display_order": 1, "is_active": True,
                },
                {
                    "title": "The Royal Empress Collection",
                    "subtitle": "Ornate Emerald & Pearl Artistry",
                    "description": "Adorn yourself with masterfully crafted necklaces, chokers, and bridal neckwear set in solid 22k gold and premium gemstones.",
                    "button_text": "Shop Necklaces", "button_link": "/?category=Necklaces",
                    "image_url": "", "background_style": "from-[#3F1D5A] via-[#5C2E7E] to-[#3F1D5A]",
                    "category": "Necklaces", "display_order": 2, "is_active": True,
                },
                {
                    "title": "Imperial Bridal Heirlooms",
                    "subtitle": "Maang Tikkas, Polki Sets & Rubies",
                    "description": "Celebrate your grand day with timeless heirloom bridal sets, meticulously set with uncut Polki diamonds and fine rubies.",
                    "button_text": "Explore Bridal Set", "button_link": "/?category=Bridal%20Collection",
                    "image_url": "", "background_style": "from-[#1B0B26] via-[#3F1D5A] to-[#1B0B26]",
                    "category": "Bridal Collection", "display_order": 3, "is_active": True,
                },
            ]
            for b_data in default_banners:
                b = BannerModel(**b_data)
                db.session.add(b)
            db.session.commit()
            logger.info("[SEED] Successfully seeded banners.")
        else:
            logger.info("[SEED] Banners already exist. Skipping seed.")

    except Exception as e:
        logger.error("[SEED] Error seeding database: %s", e)


with app.app_context():
    db.create_all()
    seed_database()

    try:
        from backend.utils.report_automation import start_report_scheduler
        start_report_scheduler(app)
    except Exception as err:
        logger.warning("[APP] Scheduler will start after DB is ready: %s", err)


if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config.get("DEBUG", False))
