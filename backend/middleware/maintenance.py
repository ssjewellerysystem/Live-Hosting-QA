import os
from flask import request, jsonify
import jwt
from backend.routes.maintenance import get_maintenance_config

from backend.config import Config

JWT_SECRET = Config.JWT_SECRET

def is_admin_request():
    """
    Helper function to check if the current request is performed by an authenticated admin.
    Checks Authorization Bearer header for valid admin token.
    """
    if request.path.startswith('/api/admin'):
        return True
    
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            if data.get("is_admin") is True:
                return True
        except Exception:
            pass
    return False

def check_maintenance_mode():
    """
    Flask before_request interceptor.
    If maintenance_mode is True in DB and request is NOT from an admin,
    blocks order creation, checkout, payment, request to buy, and coupon application endpoints.
    Returns HTTP 503 Service Unavailable.
    """
    # Always allow OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        return None

    # Check if maintenance mode is ON in database
    config = get_maintenance_config()
    if not config.get("maintenance_mode", False):
        return None

    # Always allow admin requests
    if is_admin_request():
        return None

    path = request.path.rstrip('/')

    # Paths explicitly blocked for regular users when maintenance mode is ON:
    # 1. Order creation / checkout endpoints (e.g. POST /api/orders)
    # 2. Request to Buy (POST /api/products/<id>/request-buy)
    # 3. Payment endpoints (e.g. /api/orders/.../payment, /api/payment/...)
    # 4. Coupon verification / application endpoints (e.g. POST /api/coupons/apply)
    is_blocked = False

    if path.startswith('/api/orders') and request.method in ['POST', 'PUT', 'DELETE']:
        # Exception: Return requests or user reading their own orders might be allowed, but order creation is POST /api/orders
        # To be strict as per requirements: Place Order, Buy Now, Payment APIs, Order Creation are BLOCKED
        is_blocked = True

    if '/request-buy' in path and request.method == 'POST':
        is_blocked = True

    if path.startswith('/api/coupons') and request.method in ['POST', 'PUT']:
        is_blocked = True

    if 'checkout' in path or 'payment' in path or 'razorpay' in path:
        if request.method != 'GET':
            is_blocked = True

    if is_blocked:
        return jsonify({
            "success": False,
            "maintenance": True,
            "message": config.get("maintenance_message") or "The website is temporarily under maintenance. Please try again later."
        }), 503

    return None
