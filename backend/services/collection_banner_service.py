import os
import time
from werkzeug.utils import secure_filename
import cloudinary.uploader
from backend.extensions import db
from backend.models.collection import CollectionModel
from backend.models.collection_banner import CollectionBanner
from backend.utils.audit import log_admin_action

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


class CollectionBannerService:
    @staticmethod
    def get_all_banners():
        """Retrieve all collection banners ordered by display_order asc, id desc."""
        banners = CollectionBanner.query.order_by(
            CollectionBanner.display_order.asc(), 
            CollectionBanner.id.desc()
        ).all()
        return [b.to_dict() for b in banners]

    @staticmethod
    def get_banner_by_id(banner_id):
        """Fetch single CollectionBanner by primary key ID."""
        cb = CollectionBanner.query.get(banner_id)
        if not cb:
            return None, f"Collection banner with ID {banner_id} not found."
        return cb.to_dict(), None

    @staticmethod
    def get_banner_by_collection(collection_identifier):
        """
        Fetch active collection banner by collection ID, name, or slug.
        Supports fallback lookup by collection banner ID as well.
        """
        if not collection_identifier:
            return None, "Collection identifier is required."

        collection_identifier = str(collection_identifier).strip()

        # Strip prefixes if passed in path
        if collection_identifier.lower().startswith('by-collection/'):
            collection_identifier = collection_identifier[14:].strip()
        elif collection_identifier.lower().startswith('collection/'):
            collection_identifier = collection_identifier[11:].strip()

        collection = None

        # 1. Try numeric collection ID
        if collection_identifier.isdigit():
            collection = CollectionModel.query.get(int(collection_identifier))

        # 2. Try numeric banner ID if collection not found
        if not collection and collection_identifier.isdigit():
            cb = CollectionBanner.query.get(int(collection_identifier))
            if cb:
                return {
                    "banner": cb.to_dict(),
                    "collection_id": cb.collection_id,
                    "collection_name": cb.collection.name if cb.collection else ""
                }, None

        # 3. Try collection name or slug (case-insensitive)
        if not collection:
            collection = CollectionModel.query.filter(
                (CollectionModel.name.ilike(collection_identifier)) |
                (CollectionModel.slug.ilike(collection_identifier))
            ).first()

        if not collection:
            return {
                "banner": None,
                "message": f"Collection '{collection_identifier}' not found."
            }, None

        # Fetch only ACTIVE banner for this collection
        banner = CollectionBanner.query.filter_by(collection_id=collection.id, is_active=True).first()

        if not banner:
            return {
                "banner": None,
                "collection_id": collection.id,
                "collection_name": collection.name,
                "message": "No active banner for this collection."
            }, None

        return {
            "banner": banner.to_dict(),
            "collection_id": collection.id,
            "collection_name": collection.name
        }, None

    @staticmethod
    def upload_banner_image(file):
        """Upload image file to Cloudinary or local static uploads folder."""
        if not file or file.filename == '':
            return None, "No file selected."

        if CLOUDINARY_ENABLED:
            try:
                upload_result = cloudinary.uploader.upload(file)
                url = upload_result.get("secure_url")
                log_admin_action("Image Uploaded", "Site Configurations", f"Uploaded collection banner image to Cloudinary: {url}")
                return {
                    "message": "Collection banner image uploaded to Cloudinary successfully!",
                    "url": url
                }, None
            except Exception as e:
                print(f"[CLOUDINARY] Upload failed, falling back to local storage: {e}")

        # Local storage fallback
        try:
            filename = secure_filename(file.filename)
            filename = f"coll_banner_{int(time.time())}_{filename}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            url = f"/static/uploads/{filename}"
            log_admin_action("Image Uploaded", "Site Configurations", f"Uploaded collection banner image locally: {url}")
            return {
                "message": "Collection banner image uploaded locally successfully!",
                "url": url
            }, None
        except Exception as ex:
            return None, f"Failed to upload collection banner image: {str(ex)}"

    @staticmethod
    def save_banner(data):
        """
        Create or update CollectionBanner for a given collection_id.
        """
        data = data or {}
        collection_id = data.get("collection_id")
        banner_image = data.get("banner_image")

        if not collection_id:
            return None, "collection_id is required.", 400
        if not banner_image or not str(banner_image).strip():
            return None, "banner_image is required.", 400

        banner_image = str(banner_image).strip()

        collection = CollectionModel.query.get(collection_id)
        if not collection:
            return None, "Selected collection does not exist.", 404

        status_val = data.get("status")
        is_active = bool(data.get("is_active", True))
        if status_val is not None:
            is_active = (str(status_val).lower() in ['active', 'true', '1'])

        banner = CollectionBanner.query.filter_by(collection_id=collection_id).first()
        is_new = banner is None

        try:
            if banner:
                banner.banner_image = banner_image
                banner.title = data.get("title", "")
                banner.subtitle = data.get("subtitle", "")
                banner.description = data.get("description", "")
                banner.button_text = data.get("button_text", "")
                banner.button_link = data.get("button_link", "")
                banner.is_active = is_active
                banner.display_order = int(data.get("display_order", 0))
                action_event = "Banner Updated"
                action_desc = f"Updated collection banner for '{collection.name}'"
            else:
                banner = CollectionBanner(
                    collection_id=collection_id,
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
                action_desc = f"Created collection banner for '{collection.name}'"

            db.session.commit()

            log_admin_action(action_event, "Site Configurations", action_desc)
            if banner_image.startswith("http"):
                log_admin_action("Image URL Saved", "Site Configurations", f"Saved remote image URL for '{collection.name}': {banner_image}")

            return {
                "message": "Collection banner saved successfully!",
                "banner": banner.to_dict()
            }, None, 201 if is_new else 200

        except Exception as e:
            db.session.rollback()
            return None, f"Error saving collection banner: {str(e)}", 500

    @staticmethod
    def update_banner(banner_id, data):
        """Update existing CollectionBanner by ID."""
        banner = CollectionBanner.query.get(banner_id)
        if not banner:
            return None, "Collection banner not found.", 404

        data = data or {}

        try:
            if "collection_id" in data and data["collection_id"] != banner.collection_id:
                new_coll_id = data["collection_id"]
                coll = CollectionModel.query.get(new_coll_id)
                if not coll:
                    return None, "Selected collection does not exist.", 404

                existing = CollectionBanner.query.filter_by(collection_id=new_coll_id).first()
                if existing and existing.id != banner.id:
                    return None, f"A banner already exists for collection '{coll.name}'.", 400
                banner.collection_id = new_coll_id

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

            coll_name = banner.collection.name if banner.collection else f"ID {banner.collection_id}"
            log_admin_action("Banner Updated", "Site Configurations", f"Updated collection banner for '{coll_name}'")

            return {
                "message": "Collection banner updated successfully!",
                "banner": banner.to_dict()
            }, None, 200

        except Exception as e:
            db.session.rollback()
            return None, f"Error updating collection banner: {str(e)}", 500

    @staticmethod
    def toggle_banner_status(banner_id, data=None):
        """Toggle CollectionBanner status (Active/Inactive)."""
        banner = CollectionBanner.query.get(banner_id)
        if not banner:
            return None, "Collection banner not found.", 404

        data = data or {}

        try:
            if "is_active" in data:
                banner.is_active = bool(data["is_active"])
            elif "status" in data:
                banner.is_active = (str(data["status"]).lower() in ['active', 'true', '1'])
            else:
                banner.is_active = not banner.is_active

            db.session.commit()

            coll_name = banner.collection.name if banner.collection else f"ID {banner.collection_id}"
            action_event = "Banner Activated" if banner.is_active else "Banner Disabled"
            log_admin_action(action_event, "Site Configurations", f"Toggled banner status for '{coll_name}' to {'Active' if banner.is_active else 'Inactive'}")

            return {
                "message": f"Banner status updated to {'Active' if banner.is_active else 'Inactive'}.",
                "banner": banner.to_dict()
            }, None, 200

        except Exception as e:
            db.session.rollback()
            return None, f"Error toggling status: {str(e)}", 500

    @staticmethod
    def delete_banner(banner_id):
        """Delete CollectionBanner by ID."""
        banner = CollectionBanner.query.get(banner_id)
        if not banner:
            return None, "Collection banner not found.", 404

        try:
            coll_name = banner.collection.name if banner.collection else f"ID {banner.collection_id}"
            db.session.delete(banner)
            db.session.commit()

            log_admin_action("Banner Deleted", "Site Configurations", f"Deleted collection banner for '{coll_name}'")

            return {"message": "Collection banner deleted successfully!"}, None, 200

        except Exception as e:
            db.session.rollback()
            return None, f"Error deleting collection banner: {str(e)}", 500
