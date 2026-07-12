import datetime
import pytz
import os
from flask import Blueprint, request, jsonify
import jwt
from backend.middleware.auth import admin_required
from backend.models.user import UserModel
from backend.models.product import ProductModel
from backend.models.order import OrderModel, OrderItem
from backend.models.coupon import CouponModel
from backend.extensions import db
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__)

JWT_SECRET = os.getenv("JWT_SECRET", "supersecret_SSJewellery_key_123")
ADMIN_ID = os.getenv("ADMIN_ID", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    admin_id = data.get("admin_id")
    password = data.get("password")
    
    if not admin_id or not password:
        return jsonify({"message": "Please enter both Admin ID and Password."}), 400
        
    if (admin_id == ADMIN_ID or admin_id == "admin@SSJewellery.com") and password == ADMIN_PASSWORD:
        # Generate JWT Token for Admin
        payload = {
            "user_id": "admin_user",
            "is_admin": True,
            "exp": datetime.datetime.now(pytz.utc) + datetime.timedelta(hours=24)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        
        # Audit Log
        from backend.utils.audit import log_admin_action
        log_admin_action("Admin Login", "Admin Authentication", "Admin login successful")
        
        return jsonify({
            "message": "Admin login successful!",
            "token": token,
            "user": {
                "name": "Administrator",
                "email": "admin@SSJewellery.com",
                "is_admin": True,
                "role": "admin"
            }
        }), 200
    else:
        # Audit Log for failed attempt
        from backend.utils.audit import log_admin_action
        log_admin_action("Admin Login", "Admin Authentication", f"Failed admin login attempt (ID: {admin_id})", status="Failed")
        return jsonify({"message": "Invalid Admin credentials. Check your configured .env file."}), 401

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_dashboard_stats():
    # 1. Total Sales (calculated from total_amount of non-cancelled orders)
    total_sales_q = db.session.query(func.sum(OrderModel.total_amount)).filter(
        OrderModel.order_status != 'Cancelled'
    ).scalar()
    total_sales = float(total_sales_q) if total_sales_q else 0.0

    # 2. Total Orders
    total_orders = OrderModel.query.count()

    # 3. Active Products (status = 'active')
    products_active = ProductModel.query.filter(ProductModel.status == 'active').count()

    # 4. Registered Users
    total_users = UserModel.query.filter_by(is_admin=False).count()

    # Calculate revenues today and this month using database aggregation
    now = datetime.datetime.now(pytz.timezone('Asia/Kolkata'))
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    today_start_naive = today_start.replace(tzinfo=None)
    month_start_naive = month_start.replace(tzinfo=None)
    
    revenue_today_q = db.session.query(func.sum(OrderModel.total_amount)).filter(
        OrderModel.order_status != 'Cancelled',
        OrderModel.created_at >= today_start_naive
    ).scalar()
    revenue_today = float(revenue_today_q) if revenue_today_q else 0.0

    revenue_month_q = db.session.query(func.sum(OrderModel.total_amount)).filter(
        OrderModel.order_status != 'Cancelled',
        OrderModel.created_at >= month_start_naive
    ).scalar()
    revenue_month = float(revenue_month_q) if revenue_month_q else 0.0
            
    # 7. Pending Orders
    pending_orders = OrderModel.query.filter_by(order_status='Pending').count()

    # 8. Low Stock Products (stock < 10)
    low_stock_products_count = ProductModel.query.filter(ProductModel.stock < 10).count()

    return jsonify({
        "total_sales": total_sales,
        "total_revenue": total_sales,
        "total_orders": total_orders,
        "active_products": products_active,
        "products_active": products_active,
        "total_products": products_active,
        "total_users": total_users,
        "revenue_today": round(revenue_today, 2),
        "revenue_month": round(revenue_month, 2),
        "pending_orders": pending_orders,
        "low_stock_products_count": low_stock_products_count
    }), 200

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    users = UserModel.find_all()
    return jsonify(users), 200

@admin_bp.route('/users-complete', methods=['GET'])
@admin_required
def get_users_complete():
    from backend.utils.timezone import format_iso_datetime
    from backend.models.order import OrderModel, Transaction
    from backend.models.user import DeliveryAddress
    from sqlalchemy.orm import joinedload, selectinload
    
    users = UserModel.query.options(
        selectinload(UserModel.addresses),
        selectinload(UserModel.orders).options(
            joinedload(OrderModel.transaction),
            selectinload(OrderModel.items)
        )
    ).all()
    
    users_data = []
    total_revenue = 0.0
    new_users_count = 0
    blocked_count = 0
    active_count = 0
    
    now = datetime.datetime.now(pytz.timezone('Asia/Kolkata'))
    current_year = now.year
    current_month = now.month
    
    for user in users:
        # Check if new this month
        u_date = user.created_at
        if u_date:
            if u_date.tzinfo is None:
                u_date = pytz.timezone('Asia/Kolkata').localize(u_date)
            if u_date.year == current_year and u_date.month == current_month:
                new_users_count += 1
                
        if user.is_blocked:
            blocked_count += 1
        else:
            active_count += 1
            
        addr = user.address
        addr_dict = {
            "street": addr.street if addr else "",
            "city": addr.city if addr else "",
            "state": addr.state if addr else "",
            "pincode": addr.pincode if addr else "",
            "country": "India"
        }
        
        # Get user's orders (eager loaded, sort in Python)
        orders = sorted(user.orders, key=lambda o: o.created_at or datetime.datetime.min, reverse=True)
        orders_list = []
        user_spent = 0.0
        last_order_date = None
        
        if orders:
            last_order_date = format_iso_datetime(orders[0].created_at)
            
        for o in orders:
            is_cancelled = (o.order_status == 'Cancelled')
            amt = float(o.total_amount)
            if not is_cancelled:
                user_spent += amt
                total_revenue += amt
                
            payment_method = "Online"
            if o.transaction:
                payment_method = o.transaction.payment_method or "Online"
                
            items_list = []
            for it in o.items:
                items_list.append({
                    "product_id": str(it.product_id) if it.product_id else "",
                    "name": it.name,
                    "price": float(it.price),
                    "quantity": int(it.quantity),
                    "image": it.image or ""
                })
                
            orders_list.append({
                "order_id": o.order_id,
                "created_at": format_iso_datetime(o.created_at),
                "total_amount": amt,
                "order_status": o.order_status,
                "payment_method": payment_method,
                "items": items_list
            })
            
        users_data.append({
            "id": str(user.id),
            "name": user.full_name,
            "mobile": user.phone or "N/A",
            "email": user.email,
            "address": addr_dict,
            "created_at": format_iso_datetime(user.created_at),
            "is_blocked": bool(user.is_blocked),
            "is_admin": bool(user.is_admin),
            "total_orders": len(orders),
            "total_spent": round(user_spent, 2),
            "last_order_date": last_order_date,
            "orders": orders_list
        })
        
    return jsonify({
        "users": users_data,
        "analytics": {
            "total_users": len(users),
            "new_users_this_month": new_users_count,
            "active_users": active_count,
            "blocked_users": blocked_count,
            "total_revenue": round(total_revenue, 2)
        }
    }), 200

@admin_bp.route('/users', methods=['POST'])
@admin_required
def create_user_by_admin():
    from backend.utils.audit import log_admin_action
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    mobile = data.get("mobile")
    role = data.get("role", "customer").lower()
    
    address_str = data.get("address", "")
    city = data.get("city", "")
    state = data.get("state", "")
    pincode = data.get("pincode", "")
    
    if not name or not email or not password or not confirm_password:
        return jsonify({"message": "Name, email, password, and confirm password are required."}), 400
        
    if password != confirm_password:
        return jsonify({"message": "Passwords do not match."}), 400
        
    # Check if user already exists
    if UserModel.query.filter_by(email=email).first():
        return jsonify({"message": "A user with this email already exists."}), 400
        
    is_admin = (role == "admin")
    
    address_dict = {
        "street": address_str,
        "city": city,
        "state": state,
        "pincode": pincode
    }
    
    user_data = UserModel.create_user(
        name=name,
        email=email,
        password=password,
        mobile=mobile,
        address=address_dict,
        is_admin=is_admin
    )
    
    if not user_data:
        return jsonify({"message": "Failed to create user."}), 500
        
    # Log admin action
    log_admin_action(
        action_type="Admin Created" if is_admin else "User Created",
        module="User Management",
        details=f"Created {'admin' if is_admin else 'customer'} account for {name} ({email})"
    )
    
    return jsonify({
        "message": "User created successfully",
        "success": True,
        "user": user_data
    }), 201

@admin_bp.route('/users/<id>', methods=['DELETE'])
@admin_required
def delete_user_route(id):
    success = UserModel.delete_user(id)
    if not success:
        return jsonify({"message": "User deletion failed or user not found."}), 404
    return jsonify({"message": "User deleted successfully!", "success": True}), 200

@admin_bp.route('/users/<id>/block', methods=['PUT'])
@admin_required
def toggle_user_block(id):
    data = request.get_json() or {}
    is_blocked = data.get("is_blocked", False)
    success = UserModel.toggle_block_user(id, is_blocked)
    if not success:
        return jsonify({"message": "Failed to update block status."}), 500
    action = "blocked" if is_blocked else "unblocked"
    
    # Audit Log
    from backend.utils.audit import log_admin_action
    action_type = "User Blocked" if is_blocked else "User Unblocked"
    user = UserModel.query.get(id)
    user_desc = f"{user.username} (Email: {user.email})" if user else f"User ID: {id}"
    db_uid = int(id) if str(id).isdigit() else None
    log_admin_action(action_type, "User Management", f"{action.capitalize()} user '{user_desc}'", user_id=db_uid)
    
    return jsonify({"message": f"User successfully {action}!", "success": True}), 200

@admin_bp.route('/users/<id>', methods=['GET'])
@admin_required
def get_user_details(id):
    from backend.utils.timezone import format_iso_datetime
    from backend.models.user import UserStatusAuditLog
    try:
        user_id = int(id)
    except ValueError:
        return jsonify({"message": "Invalid user ID"}), 400
        
    user = UserModel.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    # Get status change audit logs
    audit_logs = UserStatusAuditLog.query.filter_by(user_id=user_id).order_by(UserStatusAuditLog.created_at.desc()).all()
    audit_list = [log.to_dict() for log in audit_logs]
    
    # Get user's orders
    from backend.models.order import OrderModel
    orders = OrderModel.query.filter_by(user_id=user_id).order_by(OrderModel.created_at.desc()).all()
    orders_list = []
    
    total_spent = 0.0
    for o in orders:
        total_spent += float(o.total_amount)
        payment_status = "Pending"
        if o.transaction:
            payment_status = o.transaction.status
        
        item_list = []
        for it in o.items:
            item_list.append({
                "product_id": str(it.product_id) if it.product_id else "",
                "name": it.name,
                "price": float(it.price),
                "quantity": int(it.quantity),
                "image": it.image or ""
            })
            
        orders_list.append({
            "id": str(o.id),
            "order_id": o.order_id,
            "created_at": format_iso_datetime(o.created_at),
            "total_amount": float(o.total_amount),
            "order_status": o.order_status,
            "payment_status": payment_status,
            "items": item_list
        })
        
    user_dict = user.to_dict()
    user_dict["total_orders"] = len(orders)
    user_dict["total_spent"] = round(total_spent, 2)
    user_dict["audit_logs"] = audit_list
    user_dict["orders"] = orders_list
    
    return jsonify(user_dict), 200

@admin_bp.route('/users/<id>/status', methods=['PUT'])
@admin_required
def update_user_status(id):
    from backend.models.user import UserStatusAuditLog
    try:
        user_id = int(id)
    except ValueError:
        return jsonify({"message": "Invalid user ID"}), 400
        
    user = UserModel.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    data = request.get_json() or {}
    is_blocked = data.get("is_blocked", False)
    reason = data.get("reason", "").strip()
    
    if not reason:
        return jsonify({"message": "Reason for status update is required."}), 400
        
    admin_id = "admin"
    token = None
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        if auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            admin_id = payload.get("user_id") or "admin"
        except Exception:
            pass
            
    # Update block status
    user.is_blocked = is_blocked
    
    # Write audit log
    status_str = "Blocked" if is_blocked else "Active"
    audit_log = UserStatusAuditLog(
        user_id=user_id,
        admin_id=admin_id,
        status_changed_to=status_str,
        reason=reason
    )
    db.session.add(audit_log)
    db.session.commit()
    
    # General Audit Log
    from backend.utils.audit import log_admin_action
    action_type = "User Blocked" if is_blocked else "User Unblocked"
    user_desc = f"{user.username} (Email: {user.email})"
    log_admin_action(action_type, "User Management", f"{status_str} user '{user_desc}'. Reason: {reason}", user_id=int(user_id))
    
    return jsonify({
        "message": f"User status successfully updated to {status_str} and logged.",
        "success": True,
        "is_blocked": is_blocked,
        "account_status": status_str
    }), 200


@admin_bp.route('/orders/<id>/return', methods=['PUT'])
@admin_required
def manage_order_return(id):
    data = request.get_json() or {}
    status = data.get("status") # 'Approved' or 'Rejected'
    message = data.get("message", "")
    
    if status not in ["Approved", "Rejected"]:
        return jsonify({"message": "Invalid return status. Must be 'Approved' or 'Rejected'."}), 400
        
    success = OrderModel.update_return_status(id, status, message)
    if not success:
        return jsonify({"message": "Failed to update return request status."}), 500
        
    order_obj = None
    if str(id).isdigit():
        order_obj = OrderModel.query.get(int(id))
    if not order_obj:
        order_obj = OrderModel.query.filter_by(order_id=str(id)).first()
        
    # Audit Log
    from backend.utils.audit import log_admin_action
    ord_id_str = order_obj.order_id if order_obj else str(id)
    log_admin_action("Order Updated", "Order Management", f"Return request for order '{ord_id_str}' was {status.lower()}")

    # Send user notification
    try:
        from backend.routes.auth import add_user_notification
        if order_obj and order_obj.user_id:
            add_user_notification(str(order_obj.user_id), "Return Request Update", f"Your return request for order {order_obj.order_id} was {status}. Message: {message}")
    except Exception as ex:
        print(f"Error notifying return updates: {ex}")
        
    return jsonify({"message": f"Return request {status.lower()} successfully!", "success": True}), 200

@admin_bp.route('/coupons', methods=['POST'])
@admin_required
def create_coupon():
    data = request.get_json() or {}
    code = data.get("code")
    discount_type = data.get("discount_type")
    discount_value = data.get("discount_value")
    min_order_amount = data.get("min_order_amount", 0.0)
    is_active = data.get("is_active", True)
    
    if not all([code, discount_type, discount_value]):
        return jsonify({"message": "Please provide code, discount_type, and discount_value."}), 400
        
    coupon = CouponModel.create_coupon(code, discount_type, discount_value, min_order_amount, is_active)
    if not coupon:
        return jsonify({"message": "Coupon code already exists."}), 400
        
    return jsonify({"message": "Coupon created successfully!", "coupon": coupon}), 201

@admin_bp.route('/coupons', methods=['GET'])
@admin_required
def get_coupons():
    coupons = CouponModel.find_all()
    return jsonify(coupons), 200

@admin_bp.route('/coupons/<id>', methods=['DELETE'])
@admin_required
def delete_coupon_route(id):
    success = CouponModel.delete_coupon(id)
    if not success:
        return jsonify({"message": "Coupon not found or failed to delete."}), 404
    return jsonify({"message": "Coupon deleted successfully!", "success": True}), 200

# Adjust product stock (increase, decrease, set exact)
@admin_bp.route('/products/<id>/stock', methods=['PUT'])
@admin_required
def adjust_product_stock(id):
    data = request.get_json() or {}
    action = data.get("action")  # 'increase', 'decrease', 'set'
    value = data.get("value")
    
    if not action or value is None:
        return jsonify({"message": "Please provide action ('increase', 'decrease', 'set') and value."}), 400
        
    try:
        value = int(value)
    except ValueError:
        return jsonify({"message": "Value must be an integer."}), 400
        
    if action == 'increase':
        success = ProductModel.update_stock(id, value, change_type='increase')
    elif action == 'decrease':
        success = ProductModel.update_stock(id, -value, change_type='decrease')
    elif action == 'set':
        success = ProductModel.set_stock(id, value, change_type='set')
    else:
        return jsonify({"message": "Invalid action. Must be 'increase', 'decrease', or 'set'."}), 400
        
    if not success:
        return jsonify({"message": "Failed to update stock. Product not found."}), 404
        
    updated_product = ProductModel.find_by_id(id)
    
    # Audit Log
    from backend.utils.audit import log_admin_action
    p_name = updated_product.get('name') if updated_product else f"ID: {id}"
    new_st = updated_product.get('stock') if updated_product else "unknown"
    log_admin_action("Stock Updated", "Inventory Management", f"Adjusted stock for '{p_name}' via '{action}' of {value}. New Stock: {new_st}")
    
    return jsonify({
        "message": f"Stock adjusted successfully via '{action}'.",
        "product": updated_product
    }), 200

# Get product stock history
@admin_bp.route('/products/<id>/stock-history', methods=['GET'])
@admin_required
def get_product_stock_history(id):
    from backend.models.product import StockHistoryModel
    history = StockHistoryModel.query.filter_by(product_id=int(id)).order_by(StockHistoryModel.created_at.desc()).all()
    return jsonify([h.to_dict() for h in history]), 200

# Get orders related to a specific product
@admin_bp.route('/products/<id>/orders', methods=['GET'])
@admin_required
def get_product_orders(id):
    from backend.models.order import OrderModel, OrderItem, Transaction
    from backend.models.user import UserModel
    
    try:
        prod_id = int(id)
    except ValueError:
        return jsonify({"message": "Invalid product ID."}), 400
        
    items = OrderItem.query.filter_by(product_id=prod_id).all()
    
    results = []
    for item in items:
        order = OrderModel.query.get(item.order_id)
        if not order:
            continue
        user = UserModel.query.get(order.user_id) if order.user_id else None
        tx = Transaction.query.filter_by(order_id=order.id).first()
        
        results.append({
            "order_id": order.order_id,
            "db_order_id": order.id,
            "customer_name": user.full_name if user else (order.shipping_address.get("name") if order.shipping_address else "Guest"),
            "quantity_ordered": item.quantity,
            "payment_method": tx.payment_method if tx else "Online",
            "order_status": order.order_status
        })
        
    return jsonify(results), 200

# Get general analytics overview dashboard data & charts
@admin_bp.route('/analytics/overview', methods=['GET'])
@admin_required
def get_analytics_overview():
    from backend.utils.analytics import (
        generate_sales_chart,
        generate_revenue_chart,
        generate_orders_chart,
        get_revenue_summary_stats,
        generate_top_selling_chart,
        generate_low_stock_chart,
        generate_revenue_trend_chart
    )
    
    sales_chart_url = generate_sales_chart()
    revenue_chart_url = generate_revenue_chart()
    orders_chart_url = generate_orders_chart()
    top_selling_url = generate_top_selling_chart()
    low_stock_url = generate_low_stock_chart()
    revenue_trend_url = generate_revenue_trend_chart()
    revenue_stats = get_revenue_summary_stats()
    
    # Return chart URLs (with a cache buster timestamp) and summary stats
    import time
    cb = int(time.time())
    
    import pytz
    import datetime
    now = datetime.datetime.now(pytz.timezone('Asia/Kolkata'))
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    total_users = UserModel.query.filter_by(is_admin=False).count()
    active_users = UserModel.query.filter_by(is_admin=False, is_blocked=False).count()
    blocked_users = UserModel.query.filter_by(is_admin=False, is_blocked=True).count()
    new_users_this_month = UserModel.query.filter(
        UserModel.is_admin == False,
        UserModel.created_at >= month_start.replace(tzinfo=None)
    ).count()
    
    return jsonify({
        "revenue_stats": revenue_stats,
        "summary_cards": {
            "total_registered": total_users,
            "new_this_month": new_users_this_month,
            "active_customers": active_users,
            "blocked_users": blocked_users,
            "total_revenue": revenue_stats["total_revenue"]
        },
        "charts": {
            "sales_chart": f"{sales_chart_url}?cb={cb}",
            "revenue_chart": f"{revenue_chart_url}?cb={cb}",
            "orders_chart": f"{orders_chart_url}?cb={cb}",
            "revenue_trend": f"{revenue_trend_url}?cb={cb}",
            "top_selling_products": f"{top_selling_url}?cb={cb}",
            "low_stock_inventory": f"{low_stock_url}?cb={cb}"
        }
    }), 200

# Get product-specific sales stats and trend chart
@admin_bp.route('/analytics/product/<id>', methods=['GET'])
@admin_required
def get_product_analytics(id):
    from backend.utils.analytics import (
        generate_product_sales_chart,
        generate_product_revenue_chart,
        generate_product_orders_chart,
        generate_product_stock_chart,
        get_product_sales_stats
    )
    
    sales_chart = generate_product_sales_chart(id)
    if not sales_chart:
        return jsonify({"message": "Product not found."}), 404
        
    revenue_chart = generate_product_revenue_chart(id)
    orders_chart = generate_product_orders_chart(id)
    stock_chart = generate_product_stock_chart(id)
    
    stats = get_product_sales_stats(id)
    
    # Calculate revenue and orders count
    orders_count = db.session.query(db.func.count(db.func.distinct(OrderItem.order_id))).join(
        OrderModel, OrderModel.id == OrderItem.order_id
    ).filter(
        OrderItem.product_id == int(id),
        OrderModel.order_status != "Cancelled"
    ).scalar() or 0
    
    revenue_generated = db.session.query(db.func.sum(OrderItem.quantity * OrderItem.price)).join(
        OrderModel, OrderModel.id == OrderItem.order_id
    ).filter(
        OrderItem.product_id == int(id),
        OrderModel.order_status != "Cancelled"
    ).scalar() or 0.0
    
    stats["orders_count"] = int(orders_count)
    stats["revenue_generated"] = float(revenue_generated)
    
    import time
    cb = int(time.time())
    
    return jsonify({
        "sales_stats": stats,
        "chart_url": f"{sales_chart}?cb={cb}",
        "charts": {
            "sales_trend": f"{sales_chart}?cb={cb}",
            "revenue_chart": f"{revenue_chart}?cb={cb}",
            "orders_chart": f"{orders_chart}?cb={cb}",
            "stock_trend": f"{stock_chart}?cb={cb}"
        }
    }), 200

# Get all product audit logs
@admin_bp.route('/audit-logs', methods=['GET'])
@admin_required
def get_all_audit_logs():
    from backend.models.product import ProductAuditLogModel, ProductModel
    
    logs = db.session.query(
        ProductAuditLogModel,
        ProductModel.name
    ).outerjoin(
        ProductModel,
        ProductModel.id == ProductAuditLogModel.product_id
    ).order_by(
        ProductAuditLogModel.created_at.desc()
    ).all()
    
    results = []
    for log, prod_name in logs:
        d = log.to_dict()
        d["product_name"] = prod_name or f"Deleted Product (ID: {log.product_id})"
        results.append(d)
        
    return jsonify(results), 200

# Get general audit logs
@admin_bp.route('/general-audit-logs', methods=['GET'])
@admin_required
def get_general_audit_logs():
    from backend.models.admin import AdminAuditLog
    
    search = request.args.get("search", "").strip()
    action_type = request.args.get("action_type", "").strip()
    status = request.args.get("status", "").strip()
    
    query = AdminAuditLog.query
    
    if search:
        query = query.filter(
            (AdminAuditLog.admin_username.like(f"%{search}%")) |
            (AdminAuditLog.details.like(f"%{search}%")) |
            (AdminAuditLog.module.like(f"%{search}%"))
        )
    if action_type:
        query = query.filter(AdminAuditLog.action_type == action_type)
    if status:
        query = query.filter(AdminAuditLog.status == status)
        
    logs = query.order_by(AdminAuditLog.created_at.desc()).all()
    return jsonify([log.to_dict() for log in logs]), 200

# Admin logout route
@admin_bp.route('/logout', methods=['POST'])
@admin_required
def admin_logout_route():
    from backend.utils.audit import log_admin_action
    log_admin_action("Admin Logout", "Admin Authentication", "Admin logged out successfully")
    return jsonify({"message": "Admin logged out successfully", "success": True}), 200


@admin_bp.route('/notifications', methods=['GET'])
@admin_required
def get_admin_notifications():
    from backend.models.notification import NotificationModel
    notifications = NotificationModel.query.filter(
        NotificationModel.type.in_(['SUPPORT_TICKET', 'BUY_REQUEST', 'LOW_STOCK'])
    ).order_by(NotificationModel.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notifications]), 200


@admin_bp.route('/notifications/<int:id>/read', methods=['PUT'])
@admin_required
def mark_admin_notification_read(id):
    from backend.models.notification import NotificationModel
    from backend.utils.timezone import get_ist_time
    notification = NotificationModel.query.filter(
        NotificationModel.id == id,
        NotificationModel.type.in_(['SUPPORT_TICKET', 'BUY_REQUEST', 'LOW_STOCK'])
    ).first()
    if not notification:
        return jsonify({"message": "Notification not found"}), 404
    notification.status = 'read'
    notification.read_at = get_ist_time()
    db.session.commit()
    return jsonify({"message": "Notification marked as read", "success": True, "notification": notification.to_dict()}), 200


@admin_bp.route('/notifications/read-all', methods=['PUT'])
@admin_required
def mark_all_admin_notifications_read():
    from backend.models.notification import NotificationModel
    from backend.utils.timezone import get_ist_time
    now = get_ist_time()
    NotificationModel.query.filter(
        NotificationModel.status == 'unread',
        NotificationModel.type.in_(['SUPPORT_TICKET', 'BUY_REQUEST', 'LOW_STOCK'])
    ).update({
        NotificationModel.status: 'read',
        NotificationModel.read_at: now
    }, synchronize_session=False)
    db.session.commit()
    return jsonify({"message": "All notifications marked as read", "success": True}), 200


@admin_bp.route('/notifications/clear-read', methods=['DELETE'])
@admin_required
def clear_read_admin_notifications():
    from backend.models.notification import NotificationModel
    NotificationModel.query.filter(
        NotificationModel.status == 'read',
        NotificationModel.type.in_(['SUPPORT_TICKET', 'BUY_REQUEST', 'LOW_STOCK'])
    ).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({"message": "Read notifications cleared successfully", "success": True}), 200


@admin_bp.route('/notifications/clear-all', methods=['DELETE'])
@admin_required
def clear_all_admin_notifications():
    from backend.models.notification import NotificationModel
    NotificationModel.query.filter(
        NotificationModel.type.in_(['SUPPORT_TICKET', 'BUY_REQUEST', 'LOW_STOCK'])
    ).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({"message": "All notifications deleted", "success": True}), 200


@admin_bp.route('/buy-requests', methods=['GET'])
@admin_required
def get_buy_requests():
    from backend.models.product import BuyRequestModel
    from backend.models.user import UserModel
    from sqlalchemy.orm import joinedload, selectinload
    requests = BuyRequestModel.query.options(
        joinedload(BuyRequestModel.product),
        joinedload(BuyRequestModel.user).selectinload(UserModel.addresses),
        joinedload(BuyRequestModel.converted_order),
        joinedload(BuyRequestModel.selected_address)
    ).order_by(BuyRequestModel.created_at.desc()).all()
    return jsonify([r.to_dict() for r in requests]), 200


@admin_bp.route('/buy-requests/<int:id>/status', methods=['PUT'])
@admin_required
def update_buy_request_status(id):
    from backend.models.product import BuyRequestModel
    from backend.routes.auth import add_user_notification
    
    req = BuyRequestModel.query.get(id)
    if not req:
        return jsonify({"message": "Buy request not found"}), 404
        
    data = request.get_json() or {}
    status = data.get("status") # 'Approved', 'Rejected', or 'Confirmed'
    expected_delivery_date = data.get("expected_delivery_date", "")
    expected_availability_date = data.get("expected_availability_date", "")
    admin_note = data.get("admin_note", "")
    
    if status and status not in ['Approved', 'Rejected', 'Confirmed']:
        return jsonify({"message": "Invalid status. Must be 'Approved', 'Rejected', or 'Confirmed'."}), 400
        
    old_status = req.status
    
    if status:
        if req.status in ['Pending', 'Approved', 'Confirmed']:
            req.status = status
            
            if status == 'Confirmed' and old_status == 'Pending':
                from backend.routes.auth import transition_buy_request
                import threading
                threading.Thread(target=transition_buy_request, args=(req.id,)).start()
                
    if status in ['Approved', 'Confirmed'] or req.status in ['Confirmed', 'Order Preparation', 'Available', 'Awaiting Payment', 'Converted To Order', 'Purchased']:
        from datetime import datetime
        import pytz
        ist = pytz.timezone('Asia/Kolkata')
        today_date = datetime.now(ist).date()
        
        if expected_availability_date:
            try:
                avail_date = datetime.strptime(expected_availability_date, "%Y-%m-%d").date()
                if avail_date < today_date:
                    return jsonify({"message": "Please select today or a future date for availability."}), 400
            except ValueError:
                return jsonify({"message": "Please select today or a future date for availability."}), 400
                
        if expected_delivery_date:
            try:
                deliv_date = datetime.strptime(expected_delivery_date, "%Y-%m-%d").date()
                if deliv_date < today_date:
                    return jsonify({"message": "Please select today or a future date for delivery."}), 400
            except ValueError:
                return jsonify({"message": "Please select today or a future date for delivery."}), 400
                
        if expected_availability_date and expected_delivery_date:
            try:
                avail_date = datetime.strptime(expected_availability_date, "%Y-%m-%d").date()
                deliv_date = datetime.strptime(expected_delivery_date, "%Y-%m-%d").date()
                if deliv_date < avail_date:
                    return jsonify({"message": "Expected delivery date must be on or after availability date."}), 400
            except ValueError:
                pass
                
        req.expected_delivery_date = expected_delivery_date
        req.expected_availability_date = expected_availability_date
        req.admin_note = admin_note
        
        if old_status == 'Pending' and status == 'Confirmed':
            title1 = "Request Confirmed"
            msg1 = f"Your buy request for '{req.product_name}' (Qty: {req.quantity}) has been confirmed. Expected Delivery: {expected_delivery_date}. Expected Availability: {expected_availability_date}. Note: {admin_note}."
            add_user_notification(str(req.user_id), title1, msg1)
            
            if req.user and req.user.email:
                try:
                    from backend.utils.email_service import send_email
                    email_subject = f"Your Buy Request for {req.product_name} is Confirmed!"
                    email_body = f"Hello {req.user.name or 'Customer'},\n\nYour buy request for '{req.product_name}' (Quantity: {req.quantity}) has been confirmed by the administrator.\n\nExpected Product Availability: {expected_availability_date}\nExpected Delivery Date: {expected_delivery_date}\nAdmin Note: {admin_note or 'No additional notes.'}\n\nStatus: Confirmed\n\nWe will notify you as soon as the item is available for checkout.\n\nBest regards,\nSSJewellery Team"
                    send_email(req.user.email, email_subject, email_body)
                except Exception as mail_ex:
                    print("Failed to send buy request confirmation email:", mail_ex)
        elif status == 'Approved':
            # Approved path (backward compatibility if any client triggers it)
            title1 = "Request Approved"
            msg1 = f"Your buy request for '{req.product_name}' (Qty: {req.quantity}) has been approved. Expected Delivery: {expected_delivery_date}. Expected Availability: {expected_availability_date}. Note: {admin_note}."
            add_user_notification(str(req.user_id), title1, msg1)
            
            title2 = "Awaiting Confirmation"
            msg2 = "Your approved buy request is awaiting your confirmation to proceed to checkout."
            add_user_notification(str(req.user_id), title2, msg2)
        else:
            title1 = "Request Details Updated"
            msg1 = f"The administrator has updated the expected dates for '{req.product_name}'. Expected Delivery: {expected_delivery_date}. Expected Availability: {expected_availability_date}. Note: {admin_note}."
            add_user_notification(str(req.user_id), title1, msg1)
    else:
        # Rejected
        req.admin_note = admin_note
        title = "Buy Request Rejected"
        msg = f"Your buy request for '{req.product_name}' was rejected. Note: {admin_note}."
        add_user_notification(str(req.user_id), title, msg)
        
    db.session.commit()
    return jsonify({"message": f"Buy request updated successfully", "success": True, "buy_request": req.to_dict()}), 200


@admin_bp.route('/report-settings', methods=['GET'])
@admin_required
def get_report_settings_route():
    from backend.utils.report_automation import get_report_settings
    settings = get_report_settings()
    return jsonify(settings), 200

@admin_bp.route('/report-settings', methods=['POST'])
@admin_required
def update_report_settings_route():
    from backend.utils.audit import log_admin_action
    data = request.get_json() or {}
    owner_email = data.get("owner_email", "").strip()
    smtp_email = data.get("smtp_email", "").strip()
    smtp_password = data.get("smtp_password", "").strip()
    
    if not owner_email or not smtp_email or not smtp_password:
        return jsonify({"message": "All fields (Owner Email, SMTP Email, SMTP App Password) are required."}), 400
        
    try:
        # Update or insert settings
        for k, v in [("owner_email", owner_email), ("smtp_email", smtp_email), ("smtp_password", smtp_password)]:
            db.session.execute(db.text("""
                INSERT INTO system_settings (setting_key, setting_value) 
                VALUES (:key, :val) 
                ON DUPLICATE KEY UPDATE setting_value = :val
            """), {"key": k, "val": v})
        db.session.commit()
        
        log_admin_action("Report Settings Updated", "Report Automation", "Owner email and SMTP configuration modified.")
        return jsonify({"message": "Settings updated successfully!", "success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update settings: {str(e)}", "success": False}), 500

@admin_bp.route('/report-logs', methods=['GET'])
@admin_required
def get_report_logs_route():
    try:
        rows = db.session.execute(db.text("""
            SELECT id, report_month, report_year, excel_filename, email_status, archive_status, cleanup_status, created_at 
            FROM monthly_report_logs 
            ORDER BY created_at DESC
        """)).fetchall()
        
        logs = []
        for r in rows:
            logs.append({
                "id": r[0],
                "report_month": r[1],
                "report_year": r[2],
                "excel_filename": r[3],
                "email_status": r[4],
                "archive_status": r[5],
                "cleanup_status": r[6],
                "created_at": r[7].isoformat() if r[7] else None
            })
        return jsonify(logs), 200
    except Exception as e:
        return jsonify({"message": f"Failed to fetch logs: {str(e)}", "success": False}), 500

@admin_bp.route('/run-report', methods=['POST'])
@admin_required
def run_report_manually_route():
    from backend.utils.audit import log_admin_action
    from backend.utils.report_automation import run_monthly_report_flow
    import datetime
    
    data = request.get_json() or {}
    month = data.get("month")
    year = data.get("year")
    
    if not month or not year:
        now = datetime.datetime.now()
        first_of_this_month = now.replace(day=1)
        last_day_of_prev_month = first_of_this_month - datetime.timedelta(days=1)
        month = last_day_of_prev_month.month
        year = last_day_of_prev_month.year
    else:
        try:
            month = int(month)
            year = int(year)
            if month < 1 or month > 12:
                return jsonify({"message": "Invalid month value. Must be between 1 and 12."}), 400
        except ValueError:
            return jsonify({"message": "Month and Year must be integers."}), 400
            
    try:
        filename = run_monthly_report_flow(month, year)
        import calendar
        month_name = calendar.month_name[month]
        log_admin_action("Manual Report Run", "Report Automation", f"Manually triggered business report for {month_name} {year}")
        return jsonify({
            "message": f"Report generated and emailed successfully for {month_name} {year}!",
            "filename": filename,
            "success": True
        }), 200
    except Exception as e:
        return jsonify({
            "message": f"Report run failed: {str(e)}",
            "success": False
        }), 500




