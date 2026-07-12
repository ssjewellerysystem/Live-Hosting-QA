from flask import Blueprint, request, jsonify
from backend.models.coupon import CouponModel
from backend.middleware.auth import token_required

coupons_bp = Blueprint('coupons', __name__)

@coupons_bp.route('/validate', methods=['POST'])
@token_required
def validate_coupon(current_user):
    data = request.get_json() or {}
    code = data.get("code", "").strip().upper()
    total_amount = float(data.get("total_amount", 0.0))
    
    if not code:
        return jsonify({"message": "Please enter a coupon code."}), 400
        
    coupon = CouponModel.find_by_code(code)
    if not coupon:
        return jsonify({"message": "Invalid or expired coupon code."}), 400
        
    if total_amount < coupon.get("min_order_amount", 0.0):
        return jsonify({
            "message": f"This coupon requires a minimum purchase of ₹{coupon['min_order_amount']}."
        }), 400
        
    discount = 0.0
    if coupon["discount_type"] == "percent":
        discount = total_amount * (coupon["discount_value"] / 100.0)
    else: # flat
        discount = coupon["discount_value"]
        
    # Cap discount at total amount
    discount = min(discount, total_amount)
    
    return jsonify({
        "message": "Coupon applied successfully!",
        "coupon": coupon,
        "discount": discount
    }), 200
