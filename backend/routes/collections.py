import json
import re
from flask import Blueprint, jsonify, request
from backend.models.collection import CollectionModel
from backend.models.product import ProductModel
from backend.extensions import db

collections_bp = Blueprint('collections', __name__)

def generate_slug(name):
    clean = re.sub(r'[^a-zA-Z0-9\s-]', '', name or '').strip().lower()
    return re.sub(r'[\s-]+', '-', clean) or 'collection'

@collections_bp.route('', methods=['GET'])
@collections_bp.route('/', methods=['GET'])
def get_collections():
    try:
        include_all = request.args.get('all') == 'true' or request.args.get('admin') == 'true'
        query = CollectionModel.query
        if not include_all:
            query = query.filter_by(is_active=True)
        collections = query.order_by(CollectionModel.display_order.asc(), CollectionModel.id.asc()).all()
        return jsonify([c.to_dict() for c in collections]), 200
    except Exception as e:
        print("Error fetching collections:", e)
        return jsonify([]), 200

@collections_bp.route('/<int:collection_id>', methods=['GET'])
def get_collection(collection_id):
    try:
        collection = CollectionModel.query.get(collection_id)
        if not collection:
            return jsonify({"message": "Collection not found"}), 404
        return jsonify(collection.to_dict()), 200
    except Exception as e:
        print("Error fetching collection:", e)
        return jsonify({"message": "Server error"}), 500

@collections_bp.route('', methods=['POST'])
@collections_bp.route('/', methods=['POST'])
def create_collection():
    try:
        data = request.get_json() or {}
        name = data.get('name') or data.get('title')
        if not name or not str(name).strip():
            return jsonify({"message": "Collection Name is required."}), 400

        name = str(name).strip()
        slug_candidate = data.get('slug') or generate_slug(name)
        
        # Ensure unique slug
        existing_slug = CollectionModel.query.filter_by(slug=slug_candidate).first()
        if existing_slug:
            slug_candidate = f"{slug_candidate}-{int(db.session.query(db.func.count(CollectionModel.id)).scalar() or 0) + 1}"

        img = data.get('image') or data.get('image_url') or data.get('thumbnail_image') or ""
        tips_raw = data.get('styling_tips') or data.get('tips')
        styling_tips_str = json.dumps(tips_raw) if isinstance(tips_raw, (list, dict)) else (str(tips_raw) if tips_raw else None)

        collection = CollectionModel(
            name=name,
            slug=slug_candidate,
            subtitle=data.get('subtitle', ''),
            description=data.get('description', ''),
            image=img,
            thumbnail_image=img,
            banner_image=data.get('banner_image') or img,
            preview_image=data.get('preview_image') or img,
            desktop_banner=data.get('desktop_banner') or img,
            mobile_banner=data.get('mobile_banner') or img,
            highlights=data.get('highlights', ''),
            rules=data.get('rules', ''),
            show_on_homepage=bool(data.get('show_on_homepage', True)),
            styling_tips=styling_tips_str,
            display_order=int(data.get('display_order', 0)),
            is_active=bool(data.get('is_active', True))
        )
        db.session.add(collection)
        db.session.commit()
        return jsonify(collection.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print("Error creating collection:", e)
        return jsonify({"message": f"Failed to create collection: {str(e)}"}), 500

@collections_bp.route('/<int:collection_id>', methods=['PUT'])
def update_collection(collection_id):
    try:
        collection = CollectionModel.query.get(collection_id)
        if not collection:
            return jsonify({"message": "Collection not found"}), 404

        data = request.get_json() or {}
        name = data.get('name') or data.get('title')
        if name and str(name).strip():
            collection.name = str(name).strip()
            if not data.get('slug'):
                collection.slug = generate_slug(collection.name)

        if 'subtitle' in data: collection.subtitle = data.get('subtitle')
        if 'description' in data: collection.description = data.get('description')
        
        img = data.get('image') or data.get('image_url') or data.get('thumbnail_image')
        if img:
            collection.image = img
            collection.thumbnail_image = img

        if 'banner_image' in data: collection.banner_image = data.get('banner_image')
        if 'preview_image' in data: collection.preview_image = data.get('preview_image')
        if 'highlights' in data: collection.highlights = data.get('highlights')
        if 'rules' in data: collection.rules = data.get('rules')
        if 'show_on_homepage' in data: collection.show_on_homepage = bool(data.get('show_on_homepage'))
        if 'display_order' in data: collection.display_order = int(data.get('display_order', 0))
        if 'is_active' in data: collection.is_active = bool(data.get('is_active'))

        tips_raw = data.get('styling_tips') or data.get('tips')
        if tips_raw is not None:
            collection.styling_tips = json.dumps(tips_raw) if isinstance(tips_raw, (list, dict)) else str(tips_raw)

        db.session.commit()
        return jsonify(collection.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        print("Error updating collection:", e)
        return jsonify({"message": f"Failed to update collection: {str(e)}"}), 500

@collections_bp.route('/<int:collection_id>/toggle', methods=['PUT'])
def toggle_collection(collection_id):
    try:
        collection = CollectionModel.query.get(collection_id)
        if not collection:
            return jsonify({"message": "Collection not found"}), 404

        collection.is_active = not collection.is_active
        db.session.commit()
        return jsonify(collection.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        print("Error toggling collection:", e)
        return jsonify({"message": "Failed to toggle collection"}), 500

@collections_bp.route('/<int:collection_id>', methods=['DELETE'])
def delete_collection(collection_id):
    try:
        collection = CollectionModel.query.get(collection_id)
        if not collection:
            return jsonify({"message": "Collection not found"}), 404

        # Unlink products linked to this collection
        ProductModel.query.filter_by(collection_id=collection.id).update({ProductModel.collection_id: None})
        db.session.delete(collection)
        db.session.commit()
        return jsonify({"message": "Collection deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print("Error deleting collection:", e)
        return jsonify({"message": "Failed to delete collection"}), 500
