import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import cloudinary
import cloudinary.uploader
from backend.models.product import ProductModel
from backend.models.review import ReviewModel
from backend.middleware.auth import token_required, admin_required
from backend.extensions import db
from backend.utils.timezone import format_iso_datetime

products_bp = Blueprint('products', __name__)

# Configure Cloudinary if credentials are set
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET
    )
    CLOUDINARY_ENABLED = True
    print("[CLOUDINARY] Configured successfully.")
else:
    CLOUDINARY_ENABLED = False
    print("[CLOUDINARY] Credentials missing. Falling back to local upload serving.")

# Local Upload folder setup
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_admin_name_from_request():
    token = None
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        if auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
    if not token:
        return "admin"
    try:
        from backend.middleware.auth import JWT_SECRET
        import jwt
        from backend.models.user import UserModel
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if data.get("user_id") == "admin_user" and data.get("is_admin"):
            return "Administrator"
        else:
            user = UserModel.find_by_id(data.get("user_id"))
            if user:
                return user.get("name") or user.get("email") or "admin"
    except Exception:
        pass
    return "admin"

@products_bp.route('', methods=['GET'])
def get_products():
    category = request.args.get('category')
    search = request.args.get('search')
    admin_view = request.args.get('admin_view') or request.args.get('admin')
    
    homepage_only = False
    if not category and not search and admin_view != 'true':
        homepage_only = True
        
    products = ProductModel.get_all(category, search, homepage_only=homepage_only)
    return jsonify(products), 200

@products_bp.route('/<id>', methods=['GET'])
def get_product(id):
    product = ProductModel.find_by_id(id)
    if not product:
        return jsonify({"message": "Product not found!"}), 404
        
    # Get reviews for this product
    reviews = ReviewModel.find_by_product_id(id)
    product['reviews'] = reviews
    return jsonify(product), 200

@products_bp.route('/categories', methods=['GET'])
def get_all_categories():
    from backend.utils.cache import categories_cache
    cached_val = categories_cache.get('all_categories')
    if cached_val is not None:
        return jsonify(cached_val), 200

    from backend.models.category import Category
    from backend.models.product import ProductModel
    from sqlalchemy.orm import joinedload
    categories = Category.query.all()
    
    result = []
    for cat in categories:
        first_product = ProductModel.query.options(
            joinedload(ProductModel.product_images)
        ).filter_by(category_id=cat.id).first()
        image_url = None
        if first_product:
            if first_product.product_images:
                images_sorted = sorted(first_product.product_images, key=lambda x: x.image_order)
                if images_sorted:
                    image_url = images_sorted[0].image_url
            elif first_product.images:
                image_url = first_product.images[0] if len(first_product.images) > 0 else None
                
        result.append({
            "id": str(cat.id),
            "_id": str(cat.id),
            "name": cat.name,
            "image_url": image_url
        })
    categories_cache.set('all_categories', result)
    return jsonify(result), 200

@products_bp.route('/categories/<category_name>/attributes', methods=['GET'])
def get_category_attributes(category_name):
    from backend.utils.cache import category_attributes_cache
    cache_key = f"attrs_{category_name}"
    cached_val = category_attributes_cache.get(cache_key)
    if cached_val is not None:
        return jsonify(cached_val), 200

    from backend.models.product import CategoryAttributeModel
    attrs = CategoryAttributeModel.query.filter_by(category_name=category_name).all()
    result = [a.to_dict() for a in attrs]
    category_attributes_cache.set(cache_key, result)
    return jsonify(result), 200


@products_bp.route('/<id>/review', methods=['POST'])
@token_required
def add_review(current_user, id):
    product = ProductModel.find_by_id(id)
    if not product:
        return jsonify({"message": "Product not found!"}), 404
        
    data = request.get_json() or {}
    rating = data.get("rating")
    comment = data.get("comment", "")
    
    if rating is None or not (1 <= int(rating) <= 5):
        return jsonify({"message": "Rating must be an integer between 1 and 5."}), 400
        
    review = ReviewModel.create_review(id, current_user["name"], rating, comment)
    return jsonify({
        "message": "Review submitted successfully!",
        "review": review
    }), 201

# Admin: Add Product
@products_bp.route('', methods=['POST'])
@admin_required
def create_product():
    data = request.get_json() or {}
    name = data.get("name")
    price = data.get("price")
    category = data.get("category")
    stock = data.get("stock")
    
    if not all([name, price, category, stock]):
        return jsonify({"message": "Please provide name, price, category, and stock."}), 400
        
    admin_name = get_admin_name_from_request()
    data["created_by"] = admin_name
    data["admin_name"] = admin_name
    product = ProductModel.create_product(data)
    
    # Invalidate category and product cache
    from backend.utils.cache import categories_cache, products_cache
    categories_cache.clear()
    products_cache.clear()
    
    # Audit Log
    from backend.utils.audit import log_admin_action
    log_admin_action("Product Added", "Product Management", f"Added product: '{name}' (Category: '{category}', Price: ₹{price}, Stock: {stock})")
    
    return jsonify({
        "message": "Product created successfully!",
        "product": product
    }), 201

# Admin: Update Product
@products_bp.route('/<id>', methods=['PUT'])
@admin_required
def update_product(id):
    product = ProductModel.find_by_id(id)
    if not product:
        return jsonify({"message": "Product not found!"}), 404
        
    data = request.get_json() or {}
    
    # Look up old product details for price/stock/category changes
    from backend.models.product import ProductModel as PM
    db_product = PM.query.get(id)
    old_price = db_product.price if db_product else None
    old_category = db_product.category if db_product else None
    old_stock = db_product.stock if db_product else None
    
    admin_name = get_admin_name_from_request()
    data["modified_by"] = admin_name
    data["admin_name"] = admin_name
    updated_product = ProductModel.update_product(id, data)
    
    # Invalidate category and product cache
    from backend.utils.cache import categories_cache, products_cache
    categories_cache.clear()
    products_cache.clear()
    
    # Audit Log
    from backend.utils.audit import log_admin_action
    new_price = data.get("price")
    new_category = data.get("category")
    new_stock = data.get("stock")
    
    if new_price is not None and old_price is not None and float(new_price) != float(old_price):
        log_admin_action("Price Changed", "Product Management", f"Changed price of product '{product['name']}' from ₹{old_price} to ₹{new_price}")
        
    if new_category is not None and old_category is not None and str(new_category) != str(old_category):
        log_admin_action("Category Changed", "Product Management", f"Changed category of product '{product['name']}' from '{old_category}' to '{new_category}'")
        
    if new_stock is not None and old_stock is not None and int(new_stock) != int(old_stock):
        log_admin_action("Stock Updated", "Inventory Management", f"Updated stock of product '{product['name']}' from {old_stock} to {new_stock}")
        
    log_admin_action("Product Updated", "Product Management", f"Updated details for product: '{product['name']}'")
    
    return jsonify({
        "message": "Product updated successfully!",
        "product": updated_product
    }), 200

# Admin: Delete Product
@products_bp.route('/<id>', methods=['DELETE'])
@admin_required
def delete_product(id):
    product = ProductModel.find_by_id(id)
    if not product:
        return jsonify({"message": "Product not found!"}), 404
        
    success = ProductModel.delete_product(id)
    if not success:
        return jsonify({"message": "Failed to delete product."}), 500
        
    # Invalidate category and product cache
    from backend.utils.cache import categories_cache, products_cache
    categories_cache.clear()
    products_cache.clear()
        
    # Audit Log
    from backend.utils.audit import log_admin_action
    log_admin_action("Product Deleted", "Product Management", f"Deleted product: '{product['name']}' (ID: {id})")
    
    return jsonify({"message": "Product deleted successfully!"}), 200


# Admin: Product Audit Logs
@products_bp.route('/<id>/logs', methods=['GET'])
@admin_required
def get_product_logs(id):
    try:
        prod_id = int(id)
    except Exception:
        return jsonify({"message": "Invalid product ID"}), 400
        
    from backend.models.product import ProductAuditLogModel
    logs = ProductAuditLogModel.query.filter_by(product_id=prod_id).order_by(ProductAuditLogModel.created_at.desc()).all()
    return jsonify([log.to_dict() for log in logs]), 200

# Admin: Product Stock History
@products_bp.route('/<id>/stock-history', methods=['GET'])
@admin_required
def get_product_stock_history(id):
    try:
        prod_id = int(id)
    except Exception:
        return jsonify({"message": "Invalid product ID"}), 400
        
    from backend.models.product import StockHistoryModel
    history = StockHistoryModel.query.filter_by(product_id=prod_id).order_by(StockHistoryModel.created_at.desc()).all()
    return jsonify([h.to_dict() for h in history]), 200

# Admin: Product Sales Analytics
@products_bp.route('/<id>/sales', methods=['GET'])
@admin_required
def get_product_sales(id):
    from backend.models.order import OrderItem, OrderModel, Transaction
    from backend.models.user import UserModel
    try:
        prod_id = int(id)
    except Exception:
        return jsonify({"message": "Invalid product ID"}), 400
        
    items = db.session.query(
        OrderItem,
        OrderModel,
        Transaction,
        UserModel
    ).join(
        OrderModel,
        OrderItem.order_id == OrderModel.id
    ).outerjoin(
        Transaction,
        Transaction.order_id == OrderModel.id
    ).outerjoin(
        UserModel,
        UserModel.id == OrderModel.user_id
    ).filter(
        OrderItem.product_id == prod_id
    ).order_by(
        OrderModel.created_at.desc()
    ).all()
    
    sales_list = []
    total_sold = 0
    total_revenue = 0.0
    
    for item, order, tx, user in items:
        qty = int(item.quantity)
        price = float(item.price)
        total = qty * price
        
        customer_name = user.full_name if user else (order.shipping_address.get("name") if order.shipping_address else "Guest")
        payment_method = tx.payment_method if tx else "Online"
        
        sales_list.append({
            "order_id": order.order_id,
            "date": format_iso_datetime(order.created_at),
            "quantity": qty,
            "price": price,
            "total": total,
            "status": order.order_status,
            "customer_name": customer_name,
            "payment_method": payment_method
        })
        
        if order.order_status not in ["Cancelled", "Returned", "Rejected"]:
            total_sold += qty
            total_revenue += total
            
    # Aggregate sales by date
    daily_sales = {}
    for s in sales_list:
        if s["status"] not in ["Cancelled", "Returned", "Rejected"]:
            dt_str = s["date"][:10]
            daily_sales[dt_str] = daily_sales.get(dt_str, 0.0) + s["total"]
            
    daily_sales_list = [{"date": k, "revenue": v} for k, v in sorted(daily_sales.items())]
    
    return jsonify({
        "sales": sales_list,
        "total_sold": total_sold,
        "total_revenue": round(total_revenue, 2),
        "daily_sales": daily_sales_list
    }), 200

# Admin: Upload Image (Cloudinary or Local fallback)
@products_bp.route('/upload', methods=['POST'])
@admin_required
def upload_image():
    if 'image' not in request.files:
        return jsonify({"message": "No file uploaded."}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"message": "No file selected."}), 400
        
    if CLOUDINARY_ENABLED:
        try:
            upload_result = cloudinary.uploader.upload(file)
            return jsonify({
                "message": "Image uploaded successfully to Cloudinary!",
                "url": upload_result.get("secure_url")
            }), 200
        except Exception as e:
            print(f"Cloudinary upload failed: {e}. Falling back to local.")
            
    # Local fallback
    try:
        filename = secure_filename(file.filename)
        import time
        filename = f"{int(time.time())}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        url = f"/static/uploads/{filename}"
        return jsonify({
            "message": "Image uploaded successfully to local storage!",
            "url": url
        }), 200
    except Exception as ex:
        return jsonify({"message": f"Failed to upload image locally: {str(ex)}"}), 500


# User: Request to Buy Out-of-Stock Product
@products_bp.route('/<id>/request-buy', methods=['POST'])
@token_required
def request_buy_product(current_user, id):
    try:
        prod_id = int(id)
    except Exception:
        return jsonify({"message": "Invalid product ID"}), 400
        
    from backend.models.product import ProductModel, BuyRequestModel
    from backend.models.admin import add_admin_notification
    
    try:
        product = ProductModel.query.with_for_update().get(prod_id)
        if not product:
            return jsonify({"message": "Product not found!"}), 404
            
        if product.stock > 0:
            return jsonify({"message": "Product is in stock. You can buy it directly!"}), 400
            
        data = request.get_json() or {}
        quantity = int(data.get("quantity", 1))
        selected_variant_raw = data.get("selected_variant", "")
        city = data.get("city")
        
        if not city:
            return jsonify({"message": "Location/City is required."}), 400
            
        # Format selected_variant if it is a dictionary/object
        if isinstance(selected_variant_raw, dict):
            variant_parts = []
            for k, v in selected_variant_raw.items():
                if v:
                    variant_parts.append(f"{k}: {v}")
            selected_variant = ", ".join(variant_parts)
        else:
            selected_variant = str(selected_variant_raw)
            
        # Check if this user has already requested to buy this product and it is still pending
        existing_request = BuyRequestModel.query.filter_by(
            product_id=prod_id, 
            user_id=int(current_user["_id"]),
            status='Pending'
        ).with_for_update().first()
        
        if existing_request:
            return jsonify({
                "message": "You already have a pending buy request for this product.",
                "success": True
            }), 200
    except Exception as e:
        db.session.rollback()
        print("Pre-checks for buy request failed:", e)
        return jsonify({"message": f"Failed to verify request: {str(e)}"}), 500
        
    try:
        buy_request = BuyRequestModel(
            product_id=prod_id,
            user_id=int(current_user["_id"]),
            product_name=product.name,
            quantity=quantity,
            selected_variant=selected_variant,
            city=city,
            status='Pending'
        )
        db.session.add(buy_request)
        db.session.commit()
        
        # Trigger Admin Notification
        variant_info = f" ({selected_variant})" if selected_variant else ""
        notification_msg = (
            f"New Buy Request\n"
            f"Product:\n{product.name}{variant_info}\n"
            f"Customer:\n{current_user['name']}\n"
            f"City:\n{city}\n"
            f"Quantity:\n{quantity}"
        )
        add_admin_notification(
            title="Buy Request Received",
            message=notification_msg,
            type="BUY_REQUEST",
            user_id=int(current_user["_id"])
        )
        
        return jsonify({
            "message": "Buy request submitted successfully!",
            "buy_request": buy_request.to_dict(),
            "success": True
        }), 201
    except Exception as e:
        db.session.rollback()
        print("Failed to save buy request:", e)
        return jsonify({"message": f"Failed to submit buy request: {str(e)}"}), 500
