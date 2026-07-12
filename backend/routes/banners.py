import os
import time
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import cloudinary.uploader
from backend.extensions import db
from backend.models.banner import BannerModel
from backend.middleware.auth import admin_required
from backend.utils.audit import log_admin_action

banners_bp = Blueprint('banners', __name__)

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    try:
        import cloudinary
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET
        )
        CLOUDINARY_ENABLED = True
    except Exception:
        CLOUDINARY_ENABLED = False
else:
    CLOUDINARY_ENABLED = False

# Local Upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 1. Public route: Get all active banners ordered by display_order
@banners_bp.route('', methods=['GET'])
def get_active_banners():
    try:
        from backend.utils.cache import banners_cache
        cached_val = banners_cache.get('active_banners')
        if cached_val is not None:
            return jsonify(cached_val), 200

        banners = BannerModel.query.filter_by(is_active=True).order_by(BannerModel.display_order.asc()).all()
        result = [b.to_dict() for b in banners]
        banners_cache.set('active_banners', result)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"message": f"Error fetching active banners: {str(e)}"}), 500

# 2. Admin route: Get all banners (including inactive ones)
@banners_bp.route('/all', methods=['GET'])
@admin_required
def get_all_banners():
    try:
        banners = BannerModel.query.order_by(BannerModel.display_order.asc()).all()
        return jsonify([b.to_dict() for b in banners]), 200
    except Exception as e:
        return jsonify({"message": f"Error fetching all banners: {str(e)}"}), 500

# 3. Admin route: Create a new banner
@banners_bp.route('', methods=['POST'])
@admin_required
def create_banner():
    try:
        data = request.get_json() or {}
        
        title = data.get("title")
        if not title:
            return jsonify({"message": "Banner Title is required."}), 400
            
        banner = BannerModel(
            title=title,
            subtitle=data.get("subtitle", ""),
            description=data.get("description", ""),
            button_text=data.get("button_text", ""),
            button_link=data.get("button_link", ""),
            image_url=data.get("image_url", ""),
            background_style=data.get("background_style", "from-slate-900 via-indigo-950 to-slate-900"),
            category=data.get("category", ""),
            display_order=int(data.get("display_order", 0)),
            is_active=bool(data.get("is_active", True))
        )
        
        db.session.add(banner)
        db.session.commit()
        
        from backend.utils.cache import banners_cache
        banners_cache.clear()
        
        log_admin_action("Banner Added", "Banner Management", f"Created banner: '{title}'")
        
        return jsonify({
            "message": "Banner created successfully!",
            "banner": banner.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error creating banner: {str(e)}"}), 550

# 4. Admin route: Update an existing banner
@banners_bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_banner(id):
    try:
        banner = BannerModel.query.get(id)
        if not banner:
            return jsonify({"message": "Banner not found."}), 404
            
        data = request.get_json() or {}
        
        if "title" in data:
            banner.title = data.get("title")
        if "subtitle" in data:
            banner.subtitle = data.get("subtitle")
        if "description" in data:
            banner.description = data.get("description")
        if "button_text" in data:
            banner.button_text = data.get("button_text")
        if "button_link" in data:
            banner.button_link = data.get("button_link")
        if "image_url" in data:
            banner.image_url = data.get("image_url")
        if "background_style" in data:
            banner.background_style = data.get("background_style")
        if "category" in data:
            banner.category = data.get("category")
        if "display_order" in data:
            banner.display_order = int(data.get("display_order", 0))
        if "is_active" in data:
            banner.is_active = bool(data.get("is_active", True))
            
        db.session.commit()
        
        from backend.utils.cache import banners_cache
        banners_cache.clear()
        
        log_admin_action("Banner Updated", "Banner Management", f"Updated banner: '{banner.title}'")
        
        return jsonify({
            "message": "Banner updated successfully!",
            "banner": banner.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error updating banner: {str(e)}"}), 500

# 5. Admin route: Delete a banner
@banners_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_banner(id):
    try:
        banner = BannerModel.query.get(id)
        if not banner:
            return jsonify({"message": "Banner not found."}), 404
            
        title = banner.title
        db.session.delete(banner)
        db.session.commit()
        
        from backend.utils.cache import banners_cache
        banners_cache.clear()
        
        log_admin_action("Banner Deleted", "Banner Management", f"Deleted banner: '{title}'")
        
        return jsonify({"message": "Banner deleted successfully!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error deleting banner: {str(e)}"}), 500

# 6. Admin route: Upload banner image
@banners_bp.route('/upload', methods=['POST'])
@admin_required
def upload_banner_image():
    if 'image' not in request.files:
        return jsonify({"message": "No file uploaded."}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"message": "No file selected."}), 400
        
    if CLOUDINARY_ENABLED:
        try:
            upload_result = cloudinary.uploader.upload(file)
            return jsonify({
                "message": "Banner image uploaded to Cloudinary successfully!",
                "url": upload_result.get("secure_url")
            }), 200
        except Exception as e:
            print(f"[CLOUDINARY] Upload failed, falling back to local: {e}")
            
    # Local fallback
    try:
        filename = secure_filename(file.filename)
        filename = f"banner_{int(time.time())}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        url = f"/static/uploads/{filename}"
        return jsonify({
            "message": "Banner image uploaded locally successfully!",
            "url": url
        }), 200
    except Exception as ex:
        return jsonify({"message": f"Failed to upload banner image: {str(ex)}"}), 500
