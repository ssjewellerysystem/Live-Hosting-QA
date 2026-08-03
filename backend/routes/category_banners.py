import os
import time
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import cloudinary.uploader
from backend.extensions import db
from backend.models.category import Category
from backend.models.category_banner import CategoryBanner
from backend.middleware.auth import admin_required
from backend.utils.audit import log_admin_action

category_banners_bp = Blueprint('category_banners', __name__)

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


# 1. Public/Admin route: Get all category banners
@category_banners_bp.route('', methods=['GET'])
def get_all_category_banners():
    try:
        banners = CategoryBanner.query.order_by(CategoryBanner.display_order.asc(), CategoryBanner.id.desc()).all()
        return jsonify([b.to_dict() for b in banners]), 200
    except Exception as e:
        return jsonify({"message": f"Error fetching category banners: {str(e)}"}), 500


# 2. Public route: Get dynamic Category Banner by Category (ID or Name)
# Alias routes to support both /api/category-banners/<identifier> and /api/category-banners/category/<identifier>
@category_banners_bp.route('/<path:category_identifier>', methods=['GET'])
@category_banners_bp.route('/category/<path:category_identifier>', methods=['GET'])
def get_banner_by_category(category_identifier):
    try:
        category_identifier = category_identifier.strip()
        
        # Strip 'category/' prefix if matched by path route
        if category_identifier.lower().startswith('category/'):
            category_identifier = category_identifier[9:].strip()

        category = None

        # Try finding by numeric category ID first
        if category_identifier.isdigit():
            category = Category.query.get(int(category_identifier))

        # If not found by category ID, check if it is a category banner ID
        if not category and category_identifier.isdigit():
            cb = CategoryBanner.query.get(int(category_identifier))
            if cb:
                return jsonify({
                    "banner": cb.to_dict(),
                    "category_id": cb.category_id,
                    "category_name": cb.category.name if cb.category else ""
                }), 200

        # Find by name (case-insensitive)
        if not category:
            category = Category.query.filter(
                (Category.name.ilike(category_identifier)) |
                (Category.name_en.ilike(category_identifier)) |
                (Category.name_hi.ilike(category_identifier))
            ).first()

        if not category:
            return jsonify({
                "banner": None,
                "message": f"Category '{category_identifier}' not found."
            }), 200

        # Fetch only ACTIVE banner for this category
        banner = CategoryBanner.query.filter_by(category_id=category.id, is_active=True).first()

        if not banner:
            return jsonify({
                "banner": None,
                "category_id": category.id,
                "category_name": category.name,
                "message": "No active banner for this category."
            }), 200

        return jsonify({
            "banner": banner.to_dict(),
            "category_id": category.id,
            "category_name": category.name
        }), 200

    except Exception as e:
        return jsonify({"message": f"Error fetching category banner: {str(e)}"}), 500


# 3. Admin route: Upload Category Banner image
@category_banners_bp.route('/upload', methods=['POST'])
@admin_required
def upload_category_banner_image():
    if 'image' not in request.files:
        return jsonify({"message": "No image file provided."}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"message": "No file selected."}), 400

    if CLOUDINARY_ENABLED:
        try:
            upload_result = cloudinary.uploader.upload(file)
            url = upload_result.get("secure_url")
            log_admin_action("Image Uploaded", "Site Configurations", f"Uploaded banner image to Cloudinary: {url}")
            return jsonify({
                "message": "Category banner image uploaded to Cloudinary successfully!",
                "url": url
            }), 200
        except Exception as e:
            print(f"[CLOUDINARY] Upload failed, falling back to local: {e}")

    # Local storage fallback
    try:
        filename = secure_filename(file.filename)
        filename = f"cat_banner_{int(time.time())}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        url = f"/static/uploads/{filename}"
        log_admin_action("Image Uploaded", "Site Configurations", f"Uploaded category banner image locally: {url}")
        return jsonify({
            "message": "Category banner image uploaded locally successfully!",
            "url": url
        }), 200
    except Exception as ex:
        return jsonify({"message": f"Failed to upload category banner image: {str(ex)}"}), 500


# 4. Admin route: Create or replace Category Banner
@category_banners_bp.route('', methods=['POST'])
@admin_required
def create_category_banner():
    try:
        data = request.get_json() or {}

        category_id = data.get("category_id")
        banner_image = data.get("banner_image")

        if not category_id:
            return jsonify({"message": "category_id is required."}), 400
        if not banner_image or not str(banner_image).strip():
            return jsonify({"message": "banner_image is required."}), 400

        banner_image = str(banner_image).strip()

        category = Category.query.get(category_id)
        if not category:
            return jsonify({"message": "Selected category does not exist."}), 404

        # Validation: Only one active banner per category. If existing banner exists, update or replace.
        banner = CategoryBanner.query.filter_by(category_id=category_id).first()

        status_val = data.get("status")
        is_active = bool(data.get("is_active", True))
        if status_val is not None:
            is_active = (str(status_val).lower() in ['active', 'true', '1'])

        is_new = banner is None

        if banner:
            # Update existing banner
            banner.banner_image = banner_image
            banner.title = data.get("title", "")
            banner.subtitle = data.get("subtitle", "")
            banner.description = data.get("description", "")
            banner.button_text = data.get("button_text", "")
            banner.button_link = data.get("button_link", "")
            banner.is_active = is_active
            banner.display_order = int(data.get("display_order", 0))
            action_event = "Banner Updated"
            action_desc = f"Updated category banner for '{category.name}'"
        else:
            # Create new banner
            banner = CategoryBanner(
                category_id=category_id,
                banner_image=banner_image,
                title=data.get("title", ""),
                subtitle=data.get("subtitle", ""),
                description=data.get("description", ""),
                button_text=data.get("button_text", ""),
                button_link=data.get("button_link", ""),
                is_active=is_active,
                display_order=int(data.get("display_order", 0))
            )
            db.session.add(banner)
            action_event = "Banner Created"
            action_desc = f"Created category banner for '{category.name}'"

        db.session.commit()

        log_admin_action(action_event, "Site Configurations", action_desc)
        if banner_image.startswith("http"):
            log_admin_action("Image URL Saved", "Site Configurations", f"Saved remote image URL for '{category.name}': {banner_image}")

        return jsonify({
            "message": "Category banner saved successfully!",
            "banner": banner.to_dict()
        }), 201 if is_new else 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error saving category banner: {str(e)}"}), 500


# 5. Admin route: Update existing Category Banner by ID
@category_banners_bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_category_banner(id):
    try:
        banner = CategoryBanner.query.get(id)
        if not banner:
            return jsonify({"message": "Category banner not found."}), 404

        data = request.get_json() or {}

        if "category_id" in data and data["category_id"] != banner.category_id:
            new_cat_id = data["category_id"]
            cat = Category.query.get(new_cat_id)
            if not cat:
                return jsonify({"message": "Selected category does not exist."}), 404
            
            # Check for duplicate
            existing = CategoryBanner.query.filter_by(category_id=new_cat_id).first()
            if existing and existing.id != banner.id:
                return jsonify({"message": f"A banner already exists for category '{cat.name}'."}), 400
            banner.category_id = new_cat_id

        if "banner_image" in data:
            banner.banner_image = str(data["banner_image"]).strip()
        if "title" in data:
            banner.title = data["title"]
        if "subtitle" in data:
            banner.subtitle = data["subtitle"]
        if "description" in data:
            banner.description = data["description"]
        if "button_text" in data:
            banner.button_text = data["button_text"]
        if "button_link" in data:
            banner.button_link = data["button_link"]
        if "display_order" in data:
            banner.display_order = int(data["display_order"])

        if "is_active" in data:
            banner.is_active = bool(data["is_active"])
        elif "status" in data:
            banner.is_active = (str(data["status"]).lower() in ['active', 'true', '1'])

        db.session.commit()

        cat_name = banner.category.name if banner.category else f"ID {banner.category_id}"
        log_admin_action("Banner Updated", "Site Configurations", f"Updated category banner for '{cat_name}'")
        if banner.banner_image and banner.banner_image.startswith("http"):
            log_admin_action("Image URL Saved", "Site Configurations", f"Updated image URL for '{cat_name}': {banner.banner_image}")

        return jsonify({
            "message": "Category banner updated successfully!",
            "banner": banner.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error updating category banner: {str(e)}"}), 500


# 6. Admin route: Toggle status (Active / Inactive)
@category_banners_bp.route('/<int:id>/status', methods=['PATCH'])
@admin_required
def toggle_category_banner_status(id):
    try:
        banner = CategoryBanner.query.get(id)
        if not banner:
            return jsonify({"message": "Category banner not found."}), 404

        data = request.get_json(silent=True) or {}
        if "is_active" in data:
            banner.is_active = bool(data["is_active"])
        elif "status" in data:
            banner.is_active = (str(data["status"]).lower() in ['active', 'true', '1'])
        else:
            banner.is_active = not banner.is_active

        db.session.commit()

        cat_name = banner.category.name if banner.category else f"ID {banner.category_id}"
        action_event = "Banner Activated" if banner.is_active else "Banner Disabled"
        log_admin_action(action_event, "Site Configurations", f"Toggled banner status for '{cat_name}' to {'Active' if banner.is_active else 'Inactive'}")

        return jsonify({
            "message": f"Banner status updated to {'Active' if banner.is_active else 'Inactive'}.",
            "banner": banner.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error toggling status: {str(e)}"}), 500


# 7. Admin route: Delete Category Banner
@category_banners_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_category_banner(id):
    try:
        banner = CategoryBanner.query.get(id)
        if not banner:
            return jsonify({"message": "Category banner not found."}), 404

        cat_name = banner.category.name if banner.category else f"ID {banner.category_id}"
        db.session.delete(banner)
        db.session.commit()

        log_admin_action("Banner Deleted", "Site Configurations", f"Deleted category banner for '{cat_name}'")

        return jsonify({"message": "Category banner deleted successfully!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error deleting category banner: {str(e)}"}), 500
