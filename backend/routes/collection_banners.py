from flask import Blueprint, request, jsonify
from backend.services.collection_banner_service import CollectionBannerService
from backend.middleware.auth import admin_required

collection_banners_bp = Blueprint('collection_banners', __name__)

# 1. Public/Admin route: Get all collection banners
@collection_banners_bp.route('', methods=['GET'])
@collection_banners_bp.route('/', methods=['GET'])
def get_all_collection_banners():
    print(f"[COLLECTION BANNER API LOG] GET /api/collection-banners requested | Path: {request.path}")
    try:
        banners = CollectionBannerService.get_all_banners()
        print(f"[COLLECTION BANNER API LOG] Successfully returned {len(banners)} banners")
        return jsonify(banners), 200
    except Exception as e:
        print(f"[COLLECTION BANNER API ERROR] GET /api/collection-banners failed: {e}")
        return jsonify({"message": f"Error fetching collection banners: {str(e)}"}), 500


# 2. Admin route: Upload Collection Banner image
# IMPORTANT: Listed BEFORE greedier path parameter routes so /upload is not interpreted as collection identifier
@collection_banners_bp.route('/upload', methods=['POST'])
@admin_required
def upload_collection_banner_image():
    print(f"[COLLECTION BANNER API LOG] POST /api/collection-banners/upload requested")
    if 'image' not in request.files:
        return jsonify({"message": "No image file provided."}), 400

    file = request.files['image']
    res, err = CollectionBannerService.upload_banner_image(file)
    if err:
        return jsonify({"message": err}), 400 if "No file" in err else 500
    return jsonify(res), 200


# 3. Public/Admin route: Get single Collection Banner by primary key integer ID
@collection_banners_bp.route('/<int:id>', methods=['GET'])
def get_collection_banner_by_id(id):
    print(f"[COLLECTION BANNER API LOG] GET /api/collection-banners/{id} requested")
    res, err = CollectionBannerService.get_banner_by_id(id)
    if err:
        return jsonify({"message": err}), 404
    return jsonify(res), 200


# 4. Public route: Get dynamic Collection Banner by Collection (ID, Name, or Slug)
@collection_banners_bp.route('/by-collection/<path:collection_identifier>', methods=['GET'])
@collection_banners_bp.route('/collection/<path:collection_identifier>', methods=['GET'])
@collection_banners_bp.route('/<path:collection_identifier>', methods=['GET'])
def get_banner_by_collection(collection_identifier):
    print(f"[COLLECTION BANNER API LOG] GET /api/collection-banners identifier '{collection_identifier}' requested | Path: {request.path}")
    try:
        res, err = CollectionBannerService.get_banner_by_collection(collection_identifier)
        if err:
            return jsonify({"message": err}), 500
        return jsonify(res), 200
    except Exception as e:
        print(f"[COLLECTION BANNER API ERROR] GET identifier '{collection_identifier}' failed: {e}")
        return jsonify({"message": f"Error fetching collection banner: {str(e)}"}), 500


# 5. Admin route: Create or replace Collection Banner
@collection_banners_bp.route('', methods=['POST'])
@collection_banners_bp.route('/', methods=['POST'])
@admin_required
def create_collection_banner():
    data = request.get_json() or {}
    print(f"[COLLECTION BANNER API LOG] POST /api/collection-banners requested | Payload: {data}")
    res, err, status_code = CollectionBannerService.save_banner(data)
    if err:
        return jsonify({"message": err}), status_code
    return jsonify(res), status_code


# 6. Admin route: Update existing Collection Banner by ID
@collection_banners_bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_collection_banner(id):
    data = request.get_json() or {}
    print(f"[COLLECTION BANNER API LOG] PUT /api/collection-banners/{id} requested | Payload: {data}")
    res, err, status_code = CollectionBannerService.update_banner(id, data)
    if err:
        return jsonify({"message": err}), status_code
    return jsonify(res), status_code


# 7. Admin route: Toggle status (Active / Inactive)
@collection_banners_bp.route('/<int:id>/status', methods=['PATCH'])
@admin_required
def toggle_collection_banner_status(id):
    data = request.get_json(silent=True) or {}
    print(f"[COLLECTION BANNER API LOG] PATCH /api/collection-banners/{id}/status requested")
    res, err, status_code = CollectionBannerService.toggle_banner_status(id, data)
    if err:
        return jsonify({"message": err}), status_code
    return jsonify(res), status_code


# 8. Admin route: Delete Collection Banner
@collection_banners_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_collection_banner(id):
    print(f"[COLLECTION BANNER API LOG] DELETE /api/collection-banners/{id} requested")
    res, err, status_code = CollectionBannerService.delete_banner(id)
    if err:
        return jsonify({"message": err}), status_code
    return jsonify(res), status_code

