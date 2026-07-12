from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.order import OrderModel
from backend.models.product import ProductModel
from backend.models.user import UserModel, DeliveryAddress
from backend.middleware.auth import token_required, admin_required
from backend.utils.email_service import send_order_confirmation

orders_bp = Blueprint('orders', __name__)

def is_address_complete(addr, name, phone):
    if not addr or not isinstance(addr, dict):
        return False
    street = addr.get("street") or addr.get("address")
    house = addr.get("house_number") or addr.get("house")
    area = addr.get("area")
    city = addr.get("city")
    state = addr.get("state")
    pincode = addr.get("pincode")
    country = addr.get("country")
    
    if not name or not str(name).strip():
        return False
    if not phone or not str(phone).strip():
        return False
    if not house or not str(house).strip():
        return False
    if not street or not str(street).strip():
        return False
    if not area or not str(area).strip():
        return False
    if not city or not str(city).strip():
        return False
    if not state or not str(state).strip():
        return False
    if not pincode or not str(pincode).strip():
        return False
    if not country or not str(country).strip():
        return False
        
    return True

@orders_bp.route('', methods=['POST'])
@token_required
def create_order(current_user):
    from backend.models.product import BuyRequestModel, ProductModel, StockHistoryModel, ProductAuditLogModel
    from backend.utils.timezone import get_ist_time
    
    data = request.get_json() or {}
    shipping_address = data.get("shipping_address")
    items = data.get("items", [])
    total_amount = data.get("total_amount")
    terms_accepted = data.get("terms_accepted")
    buy_request_id = data.get("buy_request_id")
    selected_address_id = data.get("selected_address_id")
    
    if not shipping_address or not items or not total_amount:
        return jsonify({"message": "Missing order details: shipping_address, items, and total_amount are required."}), 400
        
    if not terms_accepted:
        return jsonify({"message": "You must accept the Terms & Conditions to place an order."}), 400
        
    try:
        # 1. Sort product IDs to prevent database deadlocks under concurrency
        product_ids = []
        for item in items:
            p_id = item.get("product_id")
            if p_id:
                try:
                    product_ids.append(int(p_id))
                except ValueError:
                    pass
        sorted_product_ids = sorted(list(set(product_ids)))

        # 2. Lock products with for update
        products_db = ProductModel.query.filter(ProductModel.id.in_(sorted_product_ids)).with_for_update().all()
        product_map = {p.id: p for p in products_db}

        # 3. Lock user row
        user_obj = UserModel.query.with_for_update().get(int(current_user["_id"]))
        if not user_obj:
            return jsonify({"message": "User not found."}), 404

        # Validate address completeness
        addr_to_validate = None
        if selected_address_id:
            db_addr = DeliveryAddress.query.filter_by(id=int(selected_address_id), user_id=user_obj.id).first()
            if not db_addr:
                return jsonify({
                    "success": False,
                    "message": "A valid delivery address is required before proceeding to payment."
                }), 400
            addr_to_validate = db_addr.to_dict()
        elif shipping_address:
            addr_to_validate = shipping_address

        name = (shipping_address or {}).get("name") or user_obj.name
        phone = (shipping_address or {}).get("phone") or user_obj.phone

        if not addr_to_validate or not is_address_complete(addr_to_validate, name, phone):
            return jsonify({
                "success": False,
                "message": "A valid delivery address is required before proceeding to payment."
            }), 400

        # 4. Lock BuyRequest row if any
        buy_req = None
        if buy_request_id:
            buy_req = BuyRequestModel.query.filter_by(
                id=int(buy_request_id),
                user_id=int(current_user["_id"])
            ).with_for_update().first()
            if not buy_req:
                return jsonify({"message": "Buy request not found."}), 404

        # 5. Validate stock availability
        for item in items:
            product_id = item.get("product_id")
            quantity = int(item.get("quantity", 1))
            
            product = product_map.get(int(product_id) if str(product_id).isdigit() else None)
            if not product:
                return jsonify({"message": f"Product '{item.get('name', 'Unknown')}' not found."}), 404
                
            # Bypass stock check if user has an 'Available' or active buy request for this product
            if not buy_req:
                has_available_request = BuyRequestModel.query.filter_by(
                    product_id=product.id,
                    user_id=user_obj.id,
                    status='Available'
                ).with_for_update().first()
                
                if not has_available_request:
                    if product.stock < quantity:
                        return jsonify({"message": f"Insufficient stock for '{product.name}'! Only {product.stock} items left."}), 400
            
        # 6. Decrease stock levels and update buy requests
        for item in items:
            product_id = int(item.get("product_id"))
            quantity = int(item.get("quantity", 1))
            product = product_map[product_id]
            
            # Check for 'Available' buy request
            if not buy_req:
                available_request = BuyRequestModel.query.filter_by(
                    product_id=product.id,
                    user_id=user_obj.id,
                    status='Available'
                ).with_for_update().first()
                
                if available_request:
                    available_request.status = 'Purchased'
                else:
                    # Decrease stock levels directly
                    old_stock = int(product.stock or 0)
                    product.stock = old_stock - quantity
                    new_stock = product.stock
                    
                    history = StockHistoryModel(
                        product_id=product.id,
                        change_type='order_placed',
                        change_amount=-quantity,
                        old_stock=old_stock,
                        new_stock=new_stock,
                        created_at=get_ist_time()
                    )
                    db.session.add(history)

                    audit = ProductAuditLogModel(
                        product_id=product.id,
                        admin_id='system',
                        action_type="Stock Update",
                        field_name="stock",
                        old_value=str(old_stock),
                        new_value=str(new_stock),
                        created_at=get_ist_time()
                    )
                    db.session.add(audit)
            else:
                # For buy requests, always reduce inventory directly
                old_stock = int(product.stock or 0)
                product.stock = old_stock - quantity
                new_stock = product.stock
                
                history = StockHistoryModel(
                    product_id=product.id,
                    change_type='order_placed',
                    change_amount=-quantity,
                    old_stock=old_stock,
                    new_stock=new_stock,
                    created_at=get_ist_time()
                )
                db.session.add(history)

                audit = ProductAuditLogModel(
                    product_id=product.id,
                    admin_id='system',
                    action_type="Stock Update",
                    field_name="stock",
                    old_value=str(old_stock),
                    new_value=str(new_stock),
                    created_at=get_ist_time()
                )
                db.session.add(audit)
            
        # 7. Create the order in DB (commit=False)
        order = OrderModel.create_order(
            user_id=user_obj.id,
            shipping_address=shipping_address,
            items=items,
            total_amount=total_amount,
            terms_accepted=terms_accepted,
            commit=False
        )
        
        # 8. If this is a buy request checkout, update the buy request
        if buy_req:
            buy_req.status = 'Converted To Order'
            buy_req.payment_completed = True
            buy_req.converted_order_id = int(order['id'])
            buy_req.converted_to_order_at = get_ist_time()
            if selected_address_id:
                try:
                    buy_req.selected_address_id = int(selected_address_id)
                except ValueError:
                    pass
            
        # 9. Empty user's cart in the database now that the order is successful (only if not a buy request)
        if not buy_req:
            UserModel.update_cart(user_obj.id, [], commit=False)
        
        # 10. Sync checkout address and email details back to user's database record
        user_email = shipping_address.get("email")
        if not user_obj.address:
            user_obj.address = DeliveryAddress(user_id=user_obj.id, is_default=True)
            db.session.add(user_obj.address)
        
        user_obj.address.house_number = shipping_address.get("house_number", "")
        user_obj.address.building_name = shipping_address.get("building_name", "")
        user_obj.address.street = shipping_address.get("address", "") or shipping_address.get("street", "")
        user_obj.address.area = shipping_address.get("area", "")
        user_obj.address.landmark = shipping_address.get("landmark", "")
        user_obj.address.city = shipping_address.get("city", "")
        user_obj.address.state = shipping_address.get("state", "")
        user_obj.address.pincode = shipping_address.get("pincode", "")
        user_obj.address.address_type = shipping_address.get("address_type", "Home")
        user_obj.address.alternate_mobile_number = shipping_address.get("alternate_mobile_number")
        
        if user_email and ("@SSJewellery.com" in current_user.get("email", "") or not current_user.get("email")):
            existing_email_user = UserModel.query.filter_by(email=user_email).first()
            if not existing_email_user or existing_email_user.id == user_obj.id:
                user_obj.email = user_email
                current_user["email"] = user_email
                
        # 11. Now, commit the entire transaction at once!
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Error during transactional checkout:", e)
        return jsonify({"message": "Checkout failed due to system error. Please try again."}), 500
        
    # 12. Post-commit workflows (non-critical notifications/emails)
    try:
        # Send order confirmation email
        send_order_confirmation(current_user.get("email", f"{current_user.get('mobile', 'user')}@SSJewellery.com"), order)
    except Exception as email_ex:
        print("Error sending order confirmation email:", email_ex)
        
    try:
        from backend.routes.auth import add_user_notification
        if buy_req:
            add_user_notification(
                current_user["_id"],
                "Order Successfully Created",
                f"Your order {order['order_id']} for requested product '{buy_req.product_name}' has been successfully created and paid."
            )
        else:
            add_user_notification(current_user["_id"], "Order Placed", f"Your order {order['order_id']} for ₹{order['total_amount']} has been successfully placed.")
    except Exception as ex:
        print(f"Error adding order notification: {ex}")
     
    try:
        from backend.models.admin import add_admin_notification
        if buy_req:
            add_admin_notification(
                title="New Order Created From Buy Request",
                message=f"User {current_user['name']} paid for request #{buy_req.id} ({buy_req.product_name}) in {buy_req.city or 'unknown city'}. Order #{order['order_id']} created.",
                type="BUY_REQUEST",
                user_id=int(current_user["_id"])
            )
        else:
            add_admin_notification(
                title="🛒 New Order",
                message=f"Order #{order['order_id']} placed",
                type="NEW_ORDER",
                order_id=int(order['id'])
            )
    except Exception as ex:
        print(f"Error adding admin notification: {ex}")
        
    return jsonify({
        "message": "Order placed successfully!",
        "order": order
    }), 201

@orders_bp.route('', methods=['GET'])
@token_required
def get_user_orders(current_user):
    orders = OrderModel.find_by_user_id(current_user["_id"])
    return jsonify(orders), 200

@orders_bp.route('/all', methods=['GET'])
@admin_required
def get_all_orders():
    orders = OrderModel.find_all()
    return jsonify(orders), 200

@orders_bp.route('/<id>/status', methods=['PUT'])
@admin_required
def update_order_status(id):
    data = request.get_json() or {}
    status = data.get("status")
    message = data.get("message")
    delivery_date = data.get("delivery_date")
    carrier = data.get("carrier")
    tracking_id = data.get("tracking_id")
    
    if not status:
        return jsonify({"message": "Please provide the status parameter."}), 400
        
    status_map = {
        "pending": "Pending",
        "confirmed": "Confirmed",
        "order confirmed": "Confirmed",
        "packed": "Packed",
        "shipped": "Shipped",
        "out for delivery": "Out for Delivery",
        "outfordelivery": "Out for Delivery",
        "delivered": "Delivered",
        "cancelled": "Cancelled"
    }
    
    normalized_status = status_map.get(status.lower().strip())
    if not normalized_status:
        valid_statuses = ["Pending", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"]
        return jsonify({"message": f"Invalid status value. Must be one of {valid_statuses}"}), 400
        
    status = normalized_status
    success = OrderModel.update_status(id, status, message, delivery_date, carrier, tracking_id)
    if not success:
        return jsonify({"message": "Order status update failed. Check order ID."}), 500
        
    order_obj = None
    if str(id).isdigit():
        order_obj = OrderModel.query.get(int(id))
    if not order_obj:
        order_obj = OrderModel.query.filter_by(order_id=str(id)).first()
        
    # Send notification to user
    try:
        from backend.routes.auth import add_user_notification
        if order_obj and order_obj.user_id:
            add_user_notification(str(order_obj.user_id), "Order Tracking Update", f"Your order {order_obj.order_id} is now: {status}. {message or ''}")
    except Exception as ex:
        print(f"Error sending tracking notification: {ex}")
        
    # Audit Log
    from backend.utils.audit import log_admin_action
    ord_id_str = order_obj.order_id if order_obj else str(id)
    u_id = order_obj.user_id if order_obj else None
    o_db_id = order_obj.id if order_obj else None
    if status == "Cancelled":
        log_admin_action("Order Cancelled", "Order Management", f"Cancelled order: '{ord_id_str}'", user_id=u_id, order_id=o_db_id)
    else:
        log_admin_action("Order Updated", "Order Management", f"Updated status of order '{ord_id_str}' to '{status}'", user_id=u_id, order_id=o_db_id)
        
    return jsonify({
        "message": "Order status updated successfully!",
        "status": status
    }), 200

@orders_bp.route('/<id>/return', methods=['POST'])
@token_required
def request_order_return(current_user, id):
    data = request.get_json() or {}
    reason = data.get("reason")
    message = data.get("message", "")
    
    if not reason:
        return jsonify({"message": "Please provide a reason for the return request."}), 400
        
    success = OrderModel.request_return(id, reason, message)
    if not success:
        return jsonify({"message": "Failed to submit return request."}), 500
        
    # Send user notification
    try:
        from backend.routes.auth import add_user_notification
        add_user_notification(current_user["_id"], "Return Requested", f"Your return request for order {id} has been submitted successfully.")
    except Exception as ex:
        print(f"Error adding return notification: {ex}")
        
    return jsonify({"message": "Return request submitted successfully!"}), 200
