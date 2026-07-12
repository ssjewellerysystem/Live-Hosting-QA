import datetime
import pytz
import os
import uuid
import random
import json
from flask import Blueprint, request, jsonify, redirect
import jwt
import bcrypt
from backend.extensions import db
from backend.models.user import UserModel, DeliveryAddress
from backend.models.otp_verification import OTPVerification
from backend.utils.helpers import generate_otp, verify_otp, is_valid_email
from backend.utils.email_service import send_email
from backend.utils.timezone import format_iso_datetime, get_ist_time
from backend.utils.security import mask_email, mask_name

auth_bp = Blueprint('auth', __name__)
JWT_SECRET = os.getenv("JWT_SECRET", "supersecret_SSJewellery_key_123")

@auth_bp.route('/register', methods=['POST'])
def register():
    # Direct registration is disabled to enforce OTP verification
    return jsonify({"message": "Direct registration is disabled. Please verify via OTP instead."}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get("email") or data.get("name")
    password = data.get("password") or data.get("mobile")
    
    if not email or not password:
        return jsonify({"message": "Please provide both email/mobile and password."}), 400
        
    if (email == 'admin' or email == 'admin@SSJewellery.com') and password == 'admin123':
        from backend.utils.audit import log_admin_action
        log_admin_action("Admin Login", "Admin Authentication", "Admin login successful")
        try:
            from backend.models.admin import add_admin_notification
            add_admin_notification(
                title="Admin Login",
                message="Administrator has logged in successfully.",
                type="admin_login"
            )
        except Exception as ex:
            print(f"Error adding admin login notification: {ex}")
        payload = {
            "user_id": "admin_user",
            "is_admin": True,
            "exp": datetime.datetime.now(pytz.utc) + datetime.timedelta(hours=24)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        return jsonify({
            "message": "Admin login successful!",
            "token": token,
            "user": {
                "id": "admin_user",
                "name": "Administrator",
                "email": "admin@SSJewellery.com",
                "mobile": "N/A",
                "is_admin": True,
                "role": "admin"
            }
        }), 200

    import re
    is_email = is_valid_email(email)
    is_mobile = re.match(r'^\+?[0-9]{7,15}$', str(email).strip()) is not None
    
    if not is_email and not is_mobile:
        return jsonify({"message": "Invalid email or mobile number."}), 400
        
    try:
        user_obj = UserModel.query.filter(
            (UserModel.email == email) | (UserModel.phone == email)
        ).with_for_update().first()
        
        if not user_obj:
            return jsonify({"message": "Account not found. Please register first."}), 404
            
        if user_obj.is_blocked:
            return jsonify({"message": "Your account has been suspended by the administrator."}), 403
            
        if not UserModel.verify_password(user_obj.password, password):
            return jsonify({"message": "Incorrect password. Please try again."}), 401
            
        if not user_obj.email_verified:
            return jsonify({"message": "Please verify your email before logging in."}), 403
            
        is_first_login = bool(user_obj.first_login)
        user_obj.last_login = get_ist_time()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Login database transaction failed:", e)
        return jsonify({"message": "An error occurred during login."}), 500
        
    user = user_obj.to_dict()
    
    # Generate JWT Token
    payload = {
        "user_id": user["_id"],
        "is_admin": user.get("is_admin", False),
        "exp": datetime.datetime.now(pytz.utc) + datetime.timedelta(hours=24)
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    
    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": {
            "id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "mobile": user["mobile"],
            "address": user.get("address", {}),
            "cart": user.get("cart", []),
            "wishlist": user.get("wishlist", []),
            "is_admin": user.get("is_admin", False),
            "role": "admin" if user.get("is_admin", False) else "customer",
            "preferred_language": user.get("preferred_language"),
            "first_login": is_first_login
        }
    }), 200

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp_route():
    data = request.get_json() or {}
    email = data.get("email")
    name = data.get("name")
    mobile = data.get("mobile")
    password = data.get("password")
    address = data.get("address")
    
    if not email:
        return jsonify({"message": "Email is required."}), 400
        
    if not is_valid_email(email):
        return jsonify({"message": "Invalid email format."}), 400
        
    # Check if duplicate registration
    existing_user = UserModel.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "User with this email already exists."}), 400
        
    # Cleanup old verification sessions for this email
    OTPVerification.query.filter_by(email=email).delete()
    
    # Invalidate expired records automatically
    current_time = get_ist_time()
    OTPVerification.query.filter(OTPVerification.expires_at < current_time).delete()
    
    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    expires_at = current_time + datetime.timedelta(minutes=5)
    
    # Hash password using bcrypt
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') if password else ""
    
    # Save temporary registration data
    temp_data = {
        "name": name or "",
        "mobile": mobile or "",
        "password_hash": hashed_password,
        "address": address or {}
    }
    
    otp_record = OTPVerification(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
        is_verified=False,
        attempts=0,
        resend_attempts=0,
        temporary_user_data=json.dumps(temp_data)
    )
    db.session.add(otp_record)
    db.session.commit()
    
    # Send email or handle development mode
    otp_mode = os.getenv("OTP_MODE", "development").lower()
    if otp_mode == "development":
        email_result = {"status": "mocked", "configuration": "development"}
    else:
        subject = "SSJewellery Verification Code"
        body = f"""Hello,

Welcome to SSJewellery.

Your verification code is:

{otp_code}

This OTP is valid for 5 minutes.

Do not share this code with anyone.

Regards,
SSJewellery Team"""
        
        email_result = send_email(email, subject, body)
        if not email_result:
            db.session.delete(otp_record)
            db.session.commit()
            return jsonify({
                "message": f"SMTP transmission failed: {email_result.get('error', 'Unable to connect to SMTP server')}",
                "success": False,
                "smtp_status": email_result.get("status"),
                "smtp_config": email_result.get("configuration")
            }), 500
        
    response_payload = {
        "message": "Verification OTP sent successfully! Please check your email.",
        "success": True,
        "smtp_status": email_result.get("status") if email_result else None,
        "smtp_config": email_result.get("configuration") if email_result else None
    }
    if otp_mode == "development":
        response_payload["otp"] = otp_code
        response_payload["otp_mode"] = "development"
    else:
        response_payload["otp_mode"] = "production"

    return jsonify(response_payload), 200


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp_route():
    data = request.get_json() or {}
    email = data.get("email")
    otp = data.get("otp")
    
    if not email or not otp:
        return jsonify({"message": "Please provide both email and OTP."}), 400
        
    try:
        otp_record = OTPVerification.query.filter_by(email=email).with_for_update().first()
        if not otp_record:
            return jsonify({"message": "No active registration verification session found. Please register again."}), 404
            
        current_time = get_ist_time()
        if otp_record.expires_at < current_time:
            db.session.delete(otp_record)
            db.session.commit()
            return jsonify({"message": "OTP has expired. Please request a new one."}), 400
            
        if otp_record.attempts >= 5:
            db.session.delete(otp_record)
            db.session.commit()
            return jsonify({"message": "Maximum verification attempts exceeded. Please restart registration."}), 400
            
        if otp != otp_record.otp_code:
            otp_record.attempts += 1
            db.session.commit()
            
            remaining = 5 - otp_record.attempts
            if remaining <= 0:
                db.session.delete(otp_record)
                db.session.commit()
                return jsonify({"message": "Maximum verification attempts exceeded. Please restart registration."}), 400
            else:
                return jsonify({"message": f"Invalid OTP. {remaining} attempts remaining."}), 400
                
        # OTP is correct!
        try:
            temp_data = json.loads(otp_record.temporary_user_data)
        except Exception:
            db.session.delete(otp_record)
            db.session.commit()
            return jsonify({"message": "Corrupted registration session data. Please register again."}), 400
            
        name = temp_data.get("name")
        mobile = temp_data.get("mobile")
        password_hash = temp_data.get("password_hash")
        address = temp_data.get("address")
        
        # Double check duplicate
        if UserModel.query.filter_by(email=email).with_for_update().first():
            db.session.delete(otp_record)
            db.session.commit()
            return jsonify({"message": "User with this email already exists."}), 400
            
        # Mark OTP verification as verified so create_user's logic passes
        otp_record.is_verified = True
        db.session.flush()
        
        # Create the user
        user_dict = UserModel.create_user(name, email, password_hash, mobile, address)
        if not user_dict:
            db.session.delete(otp_record)
            db.session.commit()
            return jsonify({"message": "Failed to create user account."}), 500
            
        try:
            from backend.models.admin import add_admin_notification
            add_admin_notification(
                title="New User Registered",
                message=f"A new user '{name}' ({email}) has successfully registered.",
                type="new_user_registration",
                user_id=int(user_dict["_id"])
            )
        except Exception as ex:
            print(f"Error adding admin notification: {ex}")
    
        # Invalidate and delete OTP record immediately on success
        db.session.delete(otp_record)
        db.session.commit()
        
        return jsonify({
            "message": "OTP verified successfully and user registered!",
            "success": True,
            "user": user_dict
        }), 201
    except Exception as e:
        db.session.rollback()
        print("Error in verify_otp_route:", e)
        return jsonify({"message": "An error occurred during OTP verification."}), 500


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp_route():
    data = request.get_json() or {}
    email = data.get("email")
    if not email:
        return jsonify({"message": "Email is required."}), 400
        
    otp_record = OTPVerification.query.filter_by(email=email).first()
    if not otp_record:
        return jsonify({"message": "No active registration verification session found. Please register again."}), 404
        
    if otp_record.resend_attempts >= 3:
        db.session.delete(otp_record)
        db.session.commit()
        return jsonify({"message": "Maximum resend attempts reached. Please register again."}), 400
        
    current_time = get_ist_time()
    otp_code = str(random.randint(100000, 999999))
    
    otp_record.otp_code = otp_code
    otp_record.expires_at = current_time + datetime.timedelta(minutes=5)
    otp_record.attempts = 0
    otp_record.resend_attempts += 1
    db.session.commit()
    
    # Send email or handle development mode
    otp_mode = os.getenv("OTP_MODE", "development").lower()
    if otp_mode == "development":
        email_result = {"status": "mocked", "configuration": "development"}
    else:
        subject = "SSJewellery Verification Code"
        body = f"""Hello,

Welcome to SSJewellery.

Your verification code is:

{otp_code}

This OTP is valid for 5 minutes.

Do not share this code with anyone.

Regards,
SSJewellery Team"""
        
        email_result = send_email(email, subject, body)
        if not email_result:
            otp_record.resend_attempts = max(0, otp_record.resend_attempts - 1)
            db.session.commit()
            return jsonify({
                "message": f"SMTP transmission failed: {email_result.get('error', 'Unable to connect to SMTP server')}",
                "success": False,
                "smtp_status": email_result.get("status"),
                "smtp_config": email_result.get("configuration")
            }), 500
        
    response_payload = {
        "message": "Verification OTP resent successfully! Please check your email.",
        "success": True,
        "smtp_status": email_result.get("status") if email_result else None,
        "smtp_config": email_result.get("configuration") if email_result else None
    }
    if otp_mode == "development":
        response_payload["otp"] = otp_code
        response_payload["otp_mode"] = "development"
    else:
        response_payload["otp_mode"] = "production"

    return jsonify(response_payload), 200


@auth_bp.route('/user-login', methods=['POST'])
def user_login_route():
    data = request.get_json() or {}
    name = data.get("name")
    mobile = data.get("mobile")
    
    if not name or not mobile:
        return jsonify({"message": "Please provide both email/mobile and password."}), 400
        
    if (name == 'admin' or name == 'admin@SSJewellery.com') and mobile == 'admin123':
        from backend.utils.audit import log_admin_action
        log_admin_action("Admin Login", "Admin Authentication", "Admin login successful")
        payload = {
            "user_id": "admin_user",
            "is_admin": True,
            "exp": datetime.datetime.now(pytz.utc) + datetime.timedelta(hours=24)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        return jsonify({
            "message": "Admin login successful!",
            "token": token,
            "user": {
                "id": "admin_user",
                "name": "Administrator",
                "email": "admin@SSJewellery.com",
                "mobile": "N/A",
                "is_admin": True,
                "role": "admin"
            }
        }), 200

    import re
    is_email = is_valid_email(name)
    is_mobile = re.match(r'^\+?[0-9]{7,15}$', str(name).strip()) is not None
    
    if not is_email and not is_mobile:
        return jsonify({"message": "Invalid email or mobile number."}), 400
        
    user_obj = UserModel.query.filter(
        (UserModel.email == name) | (UserModel.phone == name)
    ).first()
    
    if not user_obj:
        return jsonify({"message": "Account not found. Please register first."}), 404
        
    if user_obj.is_blocked:
        return jsonify({"message": "Your account has been suspended by the administrator."}), 403
        
    if not UserModel.verify_password(user_obj.password, mobile):
        return jsonify({"message": "Incorrect password. Please try again."}), 401
        
    if not user_obj.email_verified:
        return jsonify({"message": "Please verify your email before logging in."}), 403
        
    is_first_login = bool(user_obj.first_login)
    user_obj.last_login = get_ist_time()
    db.session.commit()
    user = user_obj.to_dict()

    # Generate JWT Token
    payload = {
        "user_id": user["_id"],
        "is_admin": user.get("is_admin", False),
        "exp": datetime.datetime.now(pytz.utc) + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    
    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": {
            "id": user["_id"],
            "name": user["name"],
            "email": user.get("email", ""),
            "mobile": user["mobile"],
            "address": user.get("address", {}),
            "cart": user.get("cart", []),
            "wishlist": user.get("wishlist", []),
            "saved_for_later": user.get("saved_for_later", []),
            "is_admin": user.get("is_admin", False),
            "role": "admin" if user.get("is_admin", False) else "customer",
            "preferred_language": user.get("preferred_language"),
            "first_login": is_first_login
        }
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email_or_mobile = data.get("email") or data.get("email_or_mobile")
    
    if not email_or_mobile:
        return jsonify({"message": "Please provide your registered email or mobile number."}), 400
        
    user_obj = UserModel.query.filter(
        (UserModel.email == email_or_mobile) | (UserModel.phone == email_or_mobile)
    ).first()
    
    if not user_obj:
        return jsonify({"message": "Account not found. Please register first."}), 404
        
    current_time = get_ist_time()
    
    # Invalidate expired records automatically
    OTPVerification.query.filter(OTPVerification.expires_at < current_time).delete()
    
    # Cleanup old verification sessions for this email
    OTPVerification.query.filter_by(email=user_obj.email).delete()
    db.session.commit()
    
    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    expires_at = current_time + datetime.timedelta(minutes=5)
    
    otp_record = OTPVerification(
        email=user_obj.email,
        otp_code=otp_code,
        expires_at=expires_at,
        is_verified=False,
        attempts=0,
        resend_attempts=0,
        user_id=user_obj.id
    )
    db.session.add(otp_record)
    db.session.commit()
    
    # Send email or handle development mode
    otp_mode = os.getenv("OTP_MODE", "development").lower()
    if otp_mode == "development":
        email_result = {"status": "mocked", "configuration": "development"}
    else:
        subject = "SSJewellery Password Reset Code"
        body = f"""Hello,
    
We received a request to reset the password for your SSJewellery account.

Your verification code is:

{otp_code}

This OTP is valid for 5 minutes.

If you did not request a password reset, please ignore this email.

Regards,
SSJewellery Team"""
        
        email_result = send_email(user_obj.email, subject, body)
        if not email_result:
            db.session.delete(otp_record)
            db.session.commit()
            return jsonify({
                "message": "SMTP transmission failed. Unable to send password reset email.",
                "success": False
            }), 500
        
    response_payload = {
        "message": "Verification OTP sent successfully! Please check your email.",
        "success": True,
        "email": user_obj.email
    }
    if otp_mode == "development":
        response_payload["otp"] = otp_code
        response_payload["otp_mode"] = "development"
    else:
        response_payload["otp_mode"] = "production"

    return jsonify(response_payload), 200

@auth_bp.route('/verify-reset-otp', methods=['POST'])
def verify_reset_otp():
    data = request.get_json() or {}
    email_or_mobile = data.get("email") or data.get("email_or_mobile")
    otp = data.get("otp")
    
    if not email_or_mobile or not otp:
        return jsonify({"message": "Please provide email/mobile and OTP."}), 400
        
    user_obj = UserModel.query.filter(
        (UserModel.email == email_or_mobile) | (UserModel.phone == email_or_mobile)
    ).first()
    
    if not user_obj:
        return jsonify({"message": "Account not found. Please register first."}), 404
        
    otp_record = OTPVerification.query.filter_by(email=user_obj.email).first()
    if not otp_record:
        return jsonify({"message": "No active password reset verification session found. Please try again."}), 404
        
    current_time = get_ist_time()
    if otp_record.expires_at < current_time:
        db.session.delete(otp_record)
        db.session.commit()
        return jsonify({"message": "OTP has expired. Please request a new one."}), 400
        
    if otp_record.attempts >= 5:
        db.session.delete(otp_record)
        db.session.commit()
        return jsonify({"message": "Maximum verification attempts exceeded. Please restart password reset."}), 400
        
    if str(otp).strip() != otp_record.otp_code:
        otp_record.attempts += 1
        db.session.commit()
        
        remaining = 5 - otp_record.attempts
        if remaining <= 0:
            db.session.delete(otp_record)
            db.session.commit()
            return jsonify({"message": "Maximum verification attempts exceeded. Please restart password reset."}), 400
        else:
            return jsonify({"message": f"Invalid OTP. {remaining} attempts remaining."}), 400
            
    # OTP is correct! Mark it as verified in database
    otp_record.is_verified = True
    db.session.commit()
    
    return jsonify({
        "message": "OTP verified successfully! You may now reset your password.",
        "success": True
    }), 200

@auth_bp.route('/resend-reset-otp', methods=['POST'])
def resend_reset_otp():
    data = request.get_json() or {}
    email_or_mobile = data.get("email") or data.get("email_or_mobile")
    if not email_or_mobile:
        return jsonify({"message": "Email is required."}), 400
        
    user_obj = UserModel.query.filter(
        (UserModel.email == email_or_mobile) | (UserModel.phone == email_or_mobile)
    ).first()
    
    if not user_obj:
        return jsonify({"message": "Account not found."}), 404
        
    otp_record = OTPVerification.query.filter_by(email=user_obj.email).first()
    if not otp_record:
        return jsonify({"message": "No active password reset verification session found. Please request a new OTP."}), 404
        
    if otp_record.resend_attempts >= 3:
        db.session.delete(otp_record)
        db.session.commit()
        return jsonify({"message": "Maximum resend attempts reached. Please start password reset again."}), 400
        
    current_time = get_ist_time()
    otp_code = str(random.randint(100000, 999999))
    
    otp_record.otp_code = otp_code
    otp_record.expires_at = current_time + datetime.timedelta(minutes=5)
    otp_record.attempts = 0
    otp_record.resend_attempts += 1
    db.session.commit()
    
    # Send email or handle development mode
    otp_mode = os.getenv("OTP_MODE", "development").lower()
    if otp_mode == "development":
        email_result = {"status": "mocked", "configuration": "development"}
    else:
        subject = "SSJewellery Password Reset Code"
        body = f"""Hello,
    
We received a request to reset the password for your SSJewellery account.

Your verification code is:

{otp_code}

This OTP is valid for 5 minutes.

If you did not request a password reset, please ignore this email.

Regards,
SSJewellery Team"""

        email_result = send_email(user_obj.email, subject, body)
        if not email_result:
            otp_record.resend_attempts = max(0, otp_record.resend_attempts - 1)
            db.session.commit()
            return jsonify({
                "message": "SMTP transmission failed. Unable to resend password reset email.",
                "success": False
            }), 500
        
    response_payload = {
        "message": "Verification OTP resent successfully! Please check your email.",
        "success": True
    }
    if otp_mode == "development":
        response_payload["otp"] = otp_code
        response_payload["otp_mode"] = "development"
    else:
        response_payload["otp_mode"] = "production"

    return jsonify(response_payload), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email_or_mobile = data.get("email") or data.get("email_or_mobile")
    new_password = data.get("new_password")
    
    if not email_or_mobile or not new_password:
        return jsonify({"message": "Please provide email/mobile and new password."}), 400
        
    user_obj = UserModel.query.filter(
        (UserModel.email == email_or_mobile) | (UserModel.phone == email_or_mobile)
    ).first()
    
    if not user_obj:
        return jsonify({"message": "Account not found. Please register first."}), 404
        
    otp_record = OTPVerification.query.filter_by(email=user_obj.email).first()
    if not otp_record:
        return jsonify({"message": "No active password reset verification session found. Please try again."}), 404
        
    # Check if OTP was verified
    if not otp_record.is_verified:
        return jsonify({"message": "OTP has not been verified yet. Please verify OTP first."}), 403
        
    current_time = get_ist_time()
    if otp_record.expires_at < current_time:
        db.session.delete(otp_record)
        db.session.commit()
        return jsonify({"message": "Verification session has expired. Please request a new OTP."}), 400
        
    # OTP is verified! Update user password
    success = UserModel.update_password(user_obj.id, new_password)
    if not success:
        return jsonify({"message": "Failed to reset password."}), 500
        
    # Delete OTP record
    db.session.delete(otp_record)
    db.session.commit()
    
    return jsonify({
        "message": "Password reset successfully! Please log in using your new password.",
        "success": True
    }), 200

@auth_bp.route('/checkout-login', methods=['POST'])
def checkout_login_route():
    from backend.models.user import DeliveryAddress, Cart
    data = request.get_json() or {}
    name = data.get("name")
    phone = data.get("phone")
    email = data.get("email")
    address = data.get("address", {})
    
    if not name or not phone:
        return jsonify({"message": "Name and phone are required for checkout registration."}), 400
        
    user_obj = UserModel.query.filter(
        (UserModel.phone == phone) | (UserModel.email == email) if email else (UserModel.phone == phone)
    ).first()
    
    if not user_obj:
        # Create a new guest user
        hashed_password = bcrypt.hashpw("".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_email = email if email else f"{phone}@SSJewellery.com"
        
        user_obj = UserModel(
            full_name=name,
            email=user_email,
            password_hash=hashed_password,
            phone=phone,
            is_blocked=False,
            is_admin=False,
            email_verified=True
        )
        db.session.add(user_obj)
        db.session.commit()
        
        # Add Address
        addr = DeliveryAddress(user_id=user_obj.id, is_default=True)
        if address:
            addr.house_number = address.get("house_number", "")
            addr.building_name = address.get("building_name", "")
            addr.street = address.get("street", "") or address.get("address", "")
            addr.area = address.get("area", "")
            addr.landmark = address.get("landmark", "")
            addr.city = address.get("city", "")
            addr.state = address.get("state", "")
            addr.pincode = address.get("pincode", "")
            addr.country = address.get("country", "India") or "India"
            addr.address_type = address.get("address_type", "Home")
        db.session.add(addr)
        
        # Initialize empty Cart
        cart = Cart(user_id=user_obj.id)
        db.session.add(cart)
        db.session.commit()

        try:
            from backend.models.admin import add_admin_notification
            add_admin_notification(
                title="New User Registered",
                message=f"A new guest user '{name}' ({user_email}) has registered during checkout.",
                type="new_user_registration",
                user_id=int(user_obj.id)
            )
        except Exception as ex:
            print(f"Error adding admin notification: {ex}")
    else:
        if name and user_obj.name != name:
            user_obj.name = name
        if email and not user_obj.email:
            user_obj.email = email
        db.session.commit()
        
    is_first_login = bool(user_obj.first_login)
    user_obj.last_login = get_ist_time()
    db.session.commit()
    user = user_obj.to_dict()
    
    # Generate JWT Token
    payload = {
        "user_id": user["_id"],
        "is_admin": user.get("is_admin", False),
        "exp": datetime.datetime.now(pytz.utc) + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    
    return jsonify({
        "message": "Checkout login successful!",
        "token": token,
        "user": {
            "id": user["_id"],
            "name": user["name"],
            "email": user.get("email", ""),
            "mobile": user["mobile"],
            "address": user.get("address", {}),
            "cart": user.get("cart", []),
            "wishlist": user.get("wishlist", []),
            "saved_for_later": user.get("saved_for_later", []),
            "is_admin": user.get("is_admin", False),
            "role": "admin" if user.get("is_admin", False) else "customer",
            "preferred_language": user.get("preferred_language"),
            "first_login": is_first_login
        }
    }), 200

# Import token middleware for subsequent routes
from backend.middleware.auth import token_required

def add_user_notification(user_id, title, message):
    try:
        uid = int(user_id)
        user = UserModel.query.get(uid)
        if user:
            current_notifications = list(user.notifications or [])
            
            # Prevent duplicate unread notifications with the same title and message
            duplicate = False
            for n in current_notifications:
                if n.get("title") == title and n.get("message") == message and not n.get("read", False):
                    duplicate = True
                    break
            
            if not duplicate:
                notification = {
                    "id": str(uuid.uuid4()),
                    "title": title,
                    "message": message,
                    "read": False,
                    "created_at": format_iso_datetime(get_ist_time())
                }
                current_notifications.append(notification)
                user.notifications = current_notifications
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(user, "notifications")
                db.session.commit()
    except Exception as e:
        print(f"Error adding notification: {e}")

@auth_bp.route('/cart', methods=['POST'])
@token_required
def sync_cart(current_user):
    data = request.get_json() or {}
    cart_items = data.get("cart", [])
    success = UserModel.update_cart(current_user["_id"], cart_items)
    if success:
        return jsonify({"message": "Cart synced successfully"}), 200
    return jsonify({"message": "Failed to sync cart"}), 500

@auth_bp.route('/wishlist', methods=['POST'])
@token_required
def sync_wishlist(current_user):
    data = request.get_json() or {}
    wishlist_items = data.get("wishlist", [])
    success = UserModel.update_wishlist(current_user["_id"], wishlist_items)
    if success:
        return jsonify({"message": "Wishlist synced successfully"}), 200
    return jsonify({"message": "Failed to sync wishlist"}), 500

@auth_bp.route('/saved-for-later', methods=['POST'])
@token_required
def sync_saved_for_later(current_user):
    data = request.get_json() or {}
    saved_items = data.get("saved_for_later", [])
    success = UserModel.update_saved_for_later(current_user["_id"], saved_items)
    if success:
        return jsonify({"message": "Saved-for-later synced successfully"}), 200
    return jsonify({"message": "Failed to sync saved-for-later"}), 500

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile_route(current_user):
    user_data = UserModel.find_by_id(current_user["_id"])
    if user_data:
        user_data["id"] = user_data["_id"]
        user_data.pop("password", None)
        return jsonify({"user": user_data}), 200
    return jsonify({"message": "User not found"}), 404

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile_route(current_user):
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    mobile = data.get("mobile")
    address = data.get("address", {})
    
    if not all([name, email, mobile]):
        return jsonify({"message": "Name, email, and mobile are required fields"}), 400
        
    alternate_mobile_number = address.get("alternate_mobile_number")
    if alternate_mobile_number:
        if not alternate_mobile_number.isdigit() or len(alternate_mobile_number) != 10:
            return jsonify({"message": "Alternate Mobile Number must be exactly 10 digits and numeric only."}), 400
        
    success = UserModel.update_profile(current_user["_id"], name, email, mobile, address)
    if success:
        updated = UserModel.find_by_id(current_user["_id"])
        updated["id"] = updated["_id"]
        updated.pop("password", None)
        return jsonify({"message": "Profile updated successfully", "user": updated}), 200
    return jsonify({"message": "Failed to update profile"}), 500

@auth_bp.route('/addresses', methods=['GET'])
@token_required
def get_addresses(current_user):
    user_obj = UserModel.query.get(int(current_user["_id"]))
    if not user_obj:
        return jsonify({"message": "User not found"}), 404
    addresses_list = [addr.to_dict() for addr in user_obj.addresses]
    return jsonify({"addresses": addresses_list}), 200

@auth_bp.route('/addresses', methods=['POST'])
@token_required
def add_address(current_user):
    try:
        user_obj = UserModel.query.with_for_update().get(int(current_user["_id"]))
        if not user_obj:
            return jsonify({"message": "User not found"}), 404
        
        data = request.get_json() or {}
        
        house_number = data.get("house_number")
        street = data.get("street") or data.get("address")
        area = data.get("area")
        landmark = data.get("landmark")
        city = data.get("city")
        state = data.get("state")
        pincode = data.get("pincode")
        address_type = data.get("address_type", "Home")
        is_default = data.get("is_default", False)
        alternate_mobile_number = data.get("alternate_mobile_number")
        
        country = data.get("country")
        if country is None:
            country = "India"
        else:
            country = country.strip()
        
        if alternate_mobile_number:
            # Validate only if provided (not empty)
            if not alternate_mobile_number.isdigit() or len(alternate_mobile_number) != 10:
                return jsonify({"message": "Alternate Mobile Number must be exactly 10 digits and numeric only."}), 400
                
        if not all([house_number, street, area, landmark, city, state, pincode, country]):
            return jsonify({"message": "All address fields (House Number, Street, Area, Landmark, City, State, Pincode, Country) are required."}), 400
            
        # If this is the user's first address, make it default regardless
        if not user_obj.addresses:
            is_default = True
            
        if is_default:
            for addr in user_obj.addresses:
                addr.is_default = False
                
        new_addr = DeliveryAddress(
            user_id=user_obj.id,
            house_number=house_number,
            building_name=data.get("building_name", ""),
            street=street,
            area=area,
            landmark=landmark,
            city=city,
            state=state,
            pincode=pincode,
            country=country,
            address_type=address_type,
            is_default=is_default,
            alternate_mobile_number=alternate_mobile_number if alternate_mobile_number else None
        )
        db.session.add(new_addr)
        db.session.commit()
        
        return jsonify({"message": "Address added successfully", "address": new_addr.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print("Error adding address:", e)
        return jsonify({"message": "An error occurred while adding address."}), 500

@auth_bp.route('/addresses/<int:address_id>', methods=['PUT'])
@token_required
def update_address(current_user, address_id):
    try:
        user_obj = UserModel.query.with_for_update().get(int(current_user["_id"]))
        if not user_obj:
            return jsonify({"message": "User not found"}), 404
            
        addr = DeliveryAddress.query.filter_by(id=address_id, user_id=user_obj.id).with_for_update().first()
        if not addr:
            return jsonify({"message": "Address not found"}), 404
            
        data = request.get_json() or {}
        
        house_number = data.get("house_number")
        street = data.get("street") or data.get("address")
        area = data.get("area")
        landmark = data.get("landmark")
        city = data.get("city")
        state = data.get("state")
        pincode = data.get("pincode")
        address_type = data.get("address_type", addr.address_type)
        is_default = data.get("is_default", addr.is_default)
        alternate_mobile_number = data.get("alternate_mobile_number")
        
        country = data.get("country")
        if country is None:
            country = addr.country or "India"
        else:
            country = country.strip()
        
        if alternate_mobile_number:
            # Validate only if provided (not empty)
            if not alternate_mobile_number.isdigit() or len(alternate_mobile_number) != 10:
                return jsonify({"message": "Alternate Mobile Number must be exactly 10 digits and numeric only."}), 400
                
        if not all([house_number, street, area, landmark, city, state, pincode, country]):
            return jsonify({"message": "All address fields (House Number, Street, Area, Landmark, City, State, Pincode, Country) are required."}), 400
            
        if is_default and not addr.is_default:
            for a in user_obj.addresses:
                a.is_default = False
                
        addr.house_number = house_number
        addr.building_name = data.get("building_name", "")
        addr.street = street
        addr.area = area
        addr.landmark = landmark
        addr.city = city
        addr.state = state
        addr.pincode = pincode
        addr.country = country
        addr.address_type = address_type
        addr.is_default = is_default
        addr.alternate_mobile_number = alternate_mobile_number if alternate_mobile_number else None
        
        db.session.flush()
        
        # If the user changed the default to False but has other addresses, set the first other address as default
        has_default = any(a.is_default for a in user_obj.addresses)
        if not has_default and user_obj.addresses:
            user_obj.addresses[0].is_default = True
            
        db.session.commit()
        return jsonify({"message": "Address updated successfully", "address": addr.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        print("Error updating address:", e)
        return jsonify({"message": "An error occurred while updating address."}), 500

@auth_bp.route('/addresses/<int:address_id>', methods=['DELETE'])
@token_required
def delete_address(current_user, address_id):
    try:
        user_obj = UserModel.query.with_for_update().get(int(current_user["_id"]))
        if not user_obj:
            return jsonify({"message": "User not found"}), 404
            
        addr = DeliveryAddress.query.filter_by(id=address_id, user_id=user_obj.id).with_for_update().first()
        if not addr:
            return jsonify({"message": "Address not found"}), 404
            
        was_default = addr.is_default
        
        db.session.delete(addr)
        db.session.flush()
        
        if was_default and user_obj.addresses:
            # Assign default to the first remaining address
            user_obj.addresses[0].is_default = True
            
        db.session.commit()
        return jsonify({"message": "Address deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print("Error deleting address:", e)
        return jsonify({"message": "An error occurred while deleting address."}), 500

@auth_bp.route('/addresses/<int:address_id>/default', methods=['PUT'])
@token_required
def set_default_address(current_user, address_id):
    try:
        user_obj = UserModel.query.with_for_update().get(int(current_user["_id"]))
        if not user_obj:
            return jsonify({"message": "User not found"}), 404
            
        addr = DeliveryAddress.query.filter_by(id=address_id, user_id=user_obj.id).with_for_update().first()
        if not addr:
            return jsonify({"message": "Address not found"}), 404
            
        for a in user_obj.addresses:
            a.is_default = (a.id == address_id)
            
        db.session.commit()
        return jsonify({"message": "Default address updated successfully", "address": addr.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        print("Error setting default address:", e)
        return jsonify({"message": "An error occurred while setting default address."}), 500

@auth_bp.route('/password', methods=['PUT'])
@token_required
def change_password_route(current_user):
    data = request.get_json() or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not current_password or not new_password:
        return jsonify({"message": "Please provide current password and new password"}), 400
        
    user_obj = UserModel.query.get(int(current_user["_id"]))
    if not user_obj or not UserModel.verify_password(user_obj.password, current_password):
        return jsonify({"message": "Incorrect current password"}), 400
        
    success = UserModel.update_password(current_user["_id"], new_password)
    if success:
        return jsonify({"message": "Password changed successfully"}), 200
    return jsonify({"message": "Failed to update password"}), 500

@auth_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    # Use find_by_id to get fresh notifications list
    user = UserModel.find_by_id(current_user["_id"])
    if not user:
        return jsonify([]), 200
    notifications = user.get("notifications", [])
    notifications = sorted(notifications, key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify(notifications), 200

@auth_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@token_required
def read_notification(current_user, notification_id):
    user_obj = UserModel.query.get(int(current_user["_id"]))
    if not user_obj:
        return jsonify({"message": "User not found"}), 404
        
    notifications = list(user_obj.notifications or [])
    for n in notifications:
        if n.get("id") == notification_id:
            n["read"] = True
            
    user_obj.notifications = notifications
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(user_obj, "notifications")
    db.session.commit()
    return jsonify({"message": "Notification read"}), 200

@auth_bp.route('/notifications/read-all', methods=['PUT'])
@token_required
def read_all_notifications(current_user):
    user_obj = UserModel.query.get(int(current_user["_id"]))
    if not user_obj:
        return jsonify({"message": "User not found"}), 404
        
    notifications = list(user_obj.notifications or [])
    for n in notifications:
        n["read"] = True
            
    user_obj.notifications = notifications
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(user_obj, "notifications")
    db.session.commit()
    return jsonify({"message": "All notifications marked as read"}), 200

@auth_bp.route('/notifications/clear-read', methods=['DELETE'])
@token_required
def clear_read_notifications(current_user):
    user_obj = UserModel.query.get(int(current_user["_id"]))
    if not user_obj:
        return jsonify({"message": "User not found"}), 404
        
    notifications = list(user_obj.notifications or [])
    unread_notifications = [n for n in notifications if not n.get("read", False)]
            
    user_obj.notifications = unread_notifications
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(user_obj, "notifications")
    db.session.commit()
    return jsonify({"message": "Read notifications cleared"}), 200

@auth_bp.route('/test-smtp', methods=['POST'])
def test_smtp():
    data = request.get_json() or {}
    email = data.get("email")
    if not email:
        return jsonify({"message": "Email is required.", "success": False}), 400
        
    subject = "SSJewellery SMTP Test Email"
    body = """Hello,

Welcome to SSJewellery.

Your verification code is:

123456

This OTP is valid for 5 minutes.

Do not share this code with anyone.

Regards,
SSJewellery Team"""
    
    email_result = send_email(email, subject, body)
    if not email_result:
        return jsonify({
            "message": "SMTP test failed.",
            "success": False,
            "error": email_result.get("error"),
            "smtp_status": email_result.get("status"),
            "smtp_config": email_result.get("configuration")
        }), 500
        
    return jsonify({
        "message": "SMTP test succeeded! Test email sent successfully.",
        "success": True,
        "smtp_status": email_result.get("status"),
        "smtp_config": email_result.get("configuration")
    }), 200

@auth_bp.route('/google/login')
def google_login():
    import urllib.parse
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI") or (request.url_root.rstrip('/') + "/api/auth/google/callback")
    
    print(f"[OAUTH REQUEST] Initiating Google login. Client ID: {client_id}, Redirect URI: {redirect_uri}")
    
    if not client_id:
        print("[OAUTH ERROR] Google Client ID is missing in environment variables.")
        return jsonify({"message": "Google Client ID is not configured."}), 500
        
    scope = "openid email profile"
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urllib.parse.urlencode({
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": scope,
            "access_type": "offline",
            "prompt": "consent"
        })
    )
    print(f"[OAUTH LOG] Redirecting user to Google OAuth: {auth_url}")
    return redirect(auth_url)

@auth_bp.route('/google/callback')
def google_callback():
    import urllib.request
    import urllib.parse
    import urllib.error
    
    print(f"[OAUTH CALLBACK] Google callback received. Request URL: {request.url}")
    
    code = request.args.get("code")
    if not code:
        err = request.args.get("error", "Unknown error")
        print(f"[OAUTH ERROR] Google authorization callback error: {err}")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error={urllib.parse.quote(err)}")
        
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI") or (request.url_root.rstrip('/') + "/api/auth/google/callback")
    
    print(f"[OAUTH TOKEN VERIFICATION] Exchanging code for token. Client ID: {client_id}")
    
    # Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    data = urllib.parse.urlencode({
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }).encode("utf-8")
    
    req = urllib.request.Request(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req) as resp:
            token_response = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8")
        print(f"[OAUTH ERROR] Google token exchange failed: {error_content}")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Token+exchange+failed")
    except Exception as e:
        print(f"[OAUTH ERROR] Google token exchange network error: {str(e)}")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Network+error")
        
    access_token = token_response.get("access_token")
    if not access_token:
        print("[OAUTH ERROR] Google token response did not contain access_token")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Invalid+token+response")
        
    print("[OAUTH TOKEN VERIFICATION] Token exchanged successfully. Fetching user profile...")
    
    # Get user profile
    profile_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    profile_req = urllib.request.Request(profile_url, headers={"Authorization": f"Bearer {access_token}"})
    try:
        with urllib.request.urlopen(profile_req) as resp:
            profile_data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[OAUTH ERROR] Google profile fetch failed: {str(e)}")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Profile+fetch+failed")
        
    masked_profile = {**profile_data}
    if 'email' in masked_profile:
        masked_profile['email'] = mask_email(masked_profile['email'])
    if 'name' in masked_profile:
        masked_profile['name'] = mask_name(masked_profile['name'])
    print(f"[OAUTH LOG] Google profile fetched: {masked_profile}")
    
    google_id = profile_data.get("sub")
    email = profile_data.get("email")
    full_name = profile_data.get("name") or "Google User"
    
    if not google_id or not email:
        print("[OAUTH ERROR] Google profile was missing user ID or email")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Missing+profile+details")
        
    # Check if user already exists
    user_obj = UserModel.query.filter_by(provider="google", provider_id=google_id).first()
    
    if user_obj:
        if user_obj.is_blocked:
            print(f"[OAUTH ERROR] Suspended user attempted Google login: {mask_email(email)}")
            return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Account+suspended")
        
        user_obj.full_name = full_name
        user_obj.email = email
        user_obj.email_verified = True
        db.session.commit()
        print(f"[OAUTH LOG] Google user login. Profile updated for: {mask_email(email)}")
    else:
        # Check if user already exists by email
        user_obj = UserModel.query.filter_by(email=email).first()
        if user_obj:
            if user_obj.is_blocked:
                print(f"[OAUTH ERROR] Suspended user attempted Google login: {mask_email(email)}")
                return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Account+suspended")
                
            user_obj.provider = "google"
            user_obj.provider_id = google_id
            user_obj.email_verified = True
            db.session.commit()
            print(f"[OAUTH LOG] Linked Google provider to existing account: {mask_email(email)}")
        else:
            # Create a new user
            print(f"[OAUTH USER CREATION] Creating new Google user in database for: {mask_email(email)}")
            hashed_password = bcrypt.hashpw(str(uuid.uuid4()).encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user_obj = UserModel(
                full_name=full_name,
                email=email,
                password_hash=hashed_password,
                phone="",
                email_verified=True,
                provider="google",
                provider_id=google_id
            )
            db.session.add(user_obj)
            db.session.commit()
            
            # Create address and cart
            from backend.models.user import DeliveryAddress, Cart
            addr = DeliveryAddress(user_id=user_obj.id)
            db.session.add(addr)
            cart = Cart(user_id=user_obj.id)
            db.session.add(cart)
            db.session.commit()

            try:
                from backend.models.admin import add_admin_notification
                add_admin_notification(
                    title="New User Registered",
                    message=f"A new user '{full_name}' ({email}) has registered via Google.",
                    type="new_user_registration",
                    user_id=int(user_obj.id)
                )
            except Exception as ex:
                print(f"Error adding admin notification: {ex}")

            print(f"[OAUTH LOG] Created new Google user: {mask_email(email)}")
            
    # Login Success: Generate JWT Token
    is_first_login = bool(user_obj.first_login)
    user_obj.last_login = get_ist_time()
    db.session.commit()
    user = user_obj.to_dict()
    user["first_login"] = is_first_login
    payload = {
        "user_id": user["_id"],
        "is_admin": user.get("is_admin", False),
        "exp": datetime.datetime.now(pytz.utc) + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    
    # Redirect back to frontend
    user_json = json.dumps(user)
    redirect_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?token={token}&user={urllib.parse.quote(user_json)}"
    print(f"[OAUTH SESSION CREATION] Login session created successfully for {mask_email(email)}. Redirecting to frontend.")
    return redirect(redirect_url)

@auth_bp.route('/microsoft/login')
def microsoft_login_route():
    import urllib.parse
    client_id = os.getenv("MICROSOFT_CLIENT_ID")
    redirect_uri = os.getenv("MICROSOFT_REDIRECT_URI") or (request.url_root.rstrip('/') + "/api/auth/microsoft/callback")
    
    print(f"[OAUTH REQUEST] Initiating Microsoft login. Client ID: {client_id}, Redirect URI: {redirect_uri}")
    
    if not client_id:
        print("[OAUTH ERROR] Microsoft Client ID is missing in environment variables.")
        return jsonify({"message": "Microsoft Client ID is not configured."}), 500
        
    scope = "openid profile email User.Read"
    auth_url = (
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?"
        + urllib.parse.urlencode({
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": scope,
            "response_mode": "query"
        })
    )
    print(f"[OAUTH LOG] Redirecting user to Microsoft OAuth: {auth_url}")
    return redirect(auth_url)

@auth_bp.route('/microsoft/callback')
def microsoft_callback():
    import urllib.request
    import urllib.parse
    import urllib.error
    
    print(f"[OAUTH CALLBACK] Microsoft callback received. Request URL: {request.url}")
    
    code = request.args.get("code")
    if not code:
        err = request.args.get("error", "Unknown error")
        print(f"[OAUTH ERROR] Microsoft authorization callback error: {err}")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error={urllib.parse.quote(err)}")
        
    client_id = os.getenv("MICROSOFT_CLIENT_ID")
    client_secret = os.getenv("MICROSOFT_CLIENT_SECRET")
    redirect_uri = os.getenv("MICROSOFT_REDIRECT_URI") or (request.url_root.rstrip('/') + "/api/auth/microsoft/callback")
    
    print(f"[OAUTH TOKEN VERIFICATION] Exchanging code for token. Client ID: {client_id}")
    
    # Exchange code for token
    token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    data = urllib.parse.urlencode({
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }).encode("utf-8")
    
    req = urllib.request.Request(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req) as resp:
            token_response = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8")
        print(f"[OAUTH ERROR] Microsoft token exchange failed: {error_content}")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Token+exchange+failed")
    except Exception as e:
        print(f"[OAUTH ERROR] Microsoft token exchange network error: {str(e)}")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Network+error")
        
    access_token = token_response.get("access_token")
    if not access_token:
        print("[OAUTH ERROR] Microsoft token response did not contain access_token")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Invalid+token+response")
        
    print("[OAUTH TOKEN VERIFICATION] Token exchanged successfully. Fetching Microsoft Graph profile...")
    
    # Get user profile from MS Graph
    profile_url = "https://graph.microsoft.com/v1.0/me"
    profile_req = urllib.request.Request(profile_url, headers={"Authorization": f"Bearer {access_token}"})
    try:
        with urllib.request.urlopen(profile_req) as resp:
            profile_data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[OAUTH ERROR] Microsoft profile fetch failed: {str(e)}")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Profile+fetch+failed")
        
    masked_profile = {**profile_data}
    if 'mail' in masked_profile:
        masked_profile['mail'] = mask_email(masked_profile['mail'])
    if 'userPrincipalName' in masked_profile:
        masked_profile['userPrincipalName'] = mask_email(masked_profile['userPrincipalName'])
    if 'displayName' in masked_profile:
        masked_profile['displayName'] = mask_name(masked_profile['displayName'])
    if 'givenName' in masked_profile:
        masked_profile['givenName'] = mask_name(masked_profile['givenName'])
    print(f"[OAUTH LOG] Microsoft profile fetched: {masked_profile}")
    
    microsoft_id = profile_data.get("id")
    email = profile_data.get("mail") or profile_data.get("userPrincipalName")
    full_name = profile_data.get("displayName") or profile_data.get("givenName") or "Microsoft User"
    
    if not microsoft_id or not email:
        print("[OAUTH ERROR] Microsoft profile was missing user ID or email")
        return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Missing+profile+details")
        
    # Check if user already exists
    user_obj = UserModel.query.filter(
        ((UserModel.provider == "microsoft") & (UserModel.provider_id == microsoft_id)) | 
        (UserModel.microsoft_id == microsoft_id)
    ).first()
    
    if user_obj:
        if user_obj.is_blocked:
            print(f"[OAUTH ERROR] Suspended user attempted Microsoft login: {mask_email(email)}")
            return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Account+suspended")
        
        user_obj.full_name = full_name
        user_obj.email = email
        user_obj.provider = "microsoft"
        user_obj.provider_id = microsoft_id
        user_obj.microsoft_id = microsoft_id
        user_obj.email_verified = True
        db.session.commit()
        print(f"[OAUTH LOG] Microsoft user login. Profile updated for: {mask_email(email)}")
    else:
        # Check if user already exists by email
        user_obj = UserModel.query.filter_by(email=email).first()
        if user_obj:
            if user_obj.is_blocked:
                print(f"[OAUTH ERROR] Suspended user attempted Microsoft login: {mask_email(email)}")
                return redirect(f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?error=Account+suspended")
                
            user_obj.provider = "microsoft"
            user_obj.provider_id = microsoft_id
            user_obj.microsoft_id = microsoft_id
            user_obj.email_verified = True
            db.session.commit()
            print(f"[OAUTH LOG] Linked Microsoft provider to existing account: {mask_email(email)}")
        else:
            # Create a new user
            print(f"[OAUTH USER CREATION] Creating new Microsoft user in database for: {mask_email(email)}")
            hashed_password = bcrypt.hashpw(str(uuid.uuid4()).encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user_obj = UserModel(
                full_name=full_name,
                email=email,
                password_hash=hashed_password,
                phone="",
                email_verified=True,
                provider="microsoft",
                provider_id=microsoft_id,
                microsoft_id=microsoft_id
            )
            db.session.add(user_obj)
            db.session.commit()
            
            # Create address and cart
            from backend.models.user import DeliveryAddress, Cart
            addr = DeliveryAddress(user_id=user_obj.id)
            db.session.add(addr)
            cart = Cart(user_id=user_obj.id)
            db.session.add(cart)
            db.session.commit()

            try:
                from backend.models.admin import add_admin_notification
                add_admin_notification(
                    title="New User Registered",
                    message=f"A new user '{full_name}' ({email}) has registered via Microsoft.",
                    type="new_user_registration",
                    user_id=int(user_obj.id)
                )
            except Exception as ex:
                print(f"Error adding admin notification: {ex}")

            print(f"[OAUTH LOG] Created new Microsoft user: {mask_email(email)}")
            
    # Login Success: Generate JWT Token
    is_first_login = bool(user_obj.first_login)
    user_obj.last_login = get_ist_time()
    db.session.commit()
    user = user_obj.to_dict()
    user["first_login"] = is_first_login
    payload = {
        "user_id": user["_id"],
        "is_admin": user.get("is_admin", False),
        "exp": datetime.datetime.now(pytz.utc) + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    
    # Redirect back to frontend
    user_json = json.dumps(user)
    redirect_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/login?token={token}&user={urllib.parse.quote(user_json)}"
    print(f"[OAUTH SESSION CREATION] Login session created successfully for {mask_email(email)}. Redirecting to frontend.")
    return redirect(redirect_url)

@auth_bp.route('/microsoft-login', methods=['POST'])
def microsoft_login():
    data = request.get_json() or {}
    access_token = data.get("accessToken")
    
    if not access_token:
        return jsonify({"message": "Microsoft access token is required."}), 400
        
    # Verify token by calling Microsoft Graph API
    import urllib.request
    import urllib.error
    
    req = urllib.request.Request(
        'https://graph.microsoft.com/v1.0/me',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            profile_data = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode('utf-8')
        print(f"Microsoft authentication failed: {error_msg}")
        return jsonify({"message": "Invalid Microsoft token or session expired."}), 401
    except Exception as e:
        print(f"Microsoft API connection error: {str(e)}")
        return jsonify({"message": "Unable to connect to Microsoft Identity services."}), 500
        
    microsoft_id = profile_data.get('id')
    email = profile_data.get('mail') or profile_data.get('userPrincipalName')
    full_name = profile_data.get('displayName') or profile_data.get('givenName') or "Microsoft User"
    
    if not microsoft_id or not email:
        return jsonify({"message": "Could not retrieve user email or ID from Microsoft profile."}), 400
        
    # 1. Check if user already exists by microsoft_id
    user_obj = UserModel.query.filter_by(microsoft_id=microsoft_id).first()
    
    if user_obj:
        # Check if user is blocked
        if user_obj.is_blocked:
            return jsonify({"message": "Your account has been suspended by the administrator."}), 403
        
        # Link / update name or email if changed, just in case
        user_obj.full_name = full_name
        user_obj.email = email
        db.session.commit()
    else:
        # 2. Check if user already exists by email (to link account)
        user_obj = UserModel.query.filter_by(email=email).first()
        if user_obj:
            if user_obj.is_blocked:
                return jsonify({"message": "Your account has been suspended by the administrator."}), 403
                
            user_obj.microsoft_id = microsoft_id
            user_obj.provider = "microsoft"
            user_obj.email_verified = True
            db.session.commit()
        else:
            # 3. Create new user record
            hashed_password = bcrypt.hashpw(str(uuid.uuid4()).encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user_obj = UserModel(
                full_name=full_name,
                email=email,
                password_hash=hashed_password,
                phone="",
                email_verified=True,
                microsoft_id=microsoft_id,
                provider="microsoft"
            )
            db.session.add(user_obj)
            db.session.commit()
            
            # Add DeliveryAddress and Cart
            from backend.models.user import DeliveryAddress, Cart
            addr = DeliveryAddress(user_id=user_obj.id)
            db.session.add(addr)
            cart = Cart(user_id=user_obj.id)
            db.session.add(cart)
            db.session.commit()

            try:
                from backend.models.admin import add_admin_notification
                add_admin_notification(
                    title="New User Registered",
                    message=f"A new user '{full_name}' ({email}) has registered via Microsoft.",
                    type="new_user_registration",
                    user_id=int(user_obj.id)
                )
            except Exception as ex:
                print(f"Error adding admin notification: {ex}")

    # Login Success: Generate JWT Token
    user = user_obj.to_dict()
    payload = {
        "user_id": user["_id"],
        "is_admin": user.get("is_admin", False),
        "exp": datetime.datetime.now(pytz.utc) + datetime.timedelta(hours=24)
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    
    return jsonify({
        "message": "Login successful via Microsoft!",
        "token": token,
        "user": {
            "id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "mobile": user["mobile"],
            "address": user.get("address", {}),
            "cart": user.get("cart", []),
            "wishlist": user.get("wishlist", []),
            "is_admin": user.get("is_admin", False),
            "preferred_language": user.get("preferred_language")
        }
    }), 200


def transition_buy_request(request_id):
    import time
    from backend.app import app
    from backend.extensions import db
    from backend.models.product import BuyRequestModel
    from backend.routes.auth import add_user_notification
    from backend.models.admin import add_admin_notification
    
    # Wait 4 seconds, then transition to Order Preparation
    time.sleep(4)
    with app.app_context():
        try:
            req = BuyRequestModel.query.get(request_id)
            if req and req.status == 'Confirmed':
                req.status = 'Order Preparation'
                db.session.commit()
                add_admin_notification(
                    title="Buy Request Preparing",
                    message=f"Buy request #{req.id} for '{req.product_name}' transitioned to 'Order Preparation'.",
                    type="BUY_REQUEST",
                    user_id=req.user_id
                )
        except Exception as ex:
            print("Error transitioning buy request to Order Preparation:", ex)
            
    # Wait another 4 seconds, then transition to Available
    time.sleep(4)
    with app.app_context():
        try:
            req = BuyRequestModel.query.get(request_id)
            if req and req.status == 'Order Preparation':
                req.status = 'Available'
                db.session.commit()
                # Notify User: Delivery Availability Update (User Bell)
                title = "Delivery Availability Update"
                msg = f"Your requested product '{req.product_name}' (Qty: {req.quantity}) is now available! Click 'Checkout' under Buy Requests tab to buy."
                add_user_notification(str(req.user_id), title, msg)
                
                add_admin_notification(
                    title="Buy Request Available",
                    message=f"Requested product '{req.product_name}' is now 'Available' for user to checkout.",
                    type="BUY_REQUEST",
                    user_id=req.user_id
                )
        except Exception as ex:
            print("Error transitioning buy request to Available:", ex)


@auth_bp.route('/buy-requests', methods=['GET'])
@token_required
def get_user_buy_requests(current_user):
    from backend.models.product import BuyRequestModel
    from backend.models.user import UserModel
    from sqlalchemy.orm import joinedload, selectinload
    requests = BuyRequestModel.query.options(
        joinedload(BuyRequestModel.product),
        joinedload(BuyRequestModel.user).selectinload(UserModel.addresses),
        joinedload(BuyRequestModel.converted_order),
        joinedload(BuyRequestModel.selected_address)
    ).filter_by(user_id=int(current_user["_id"])).order_by(BuyRequestModel.created_at.desc()).all()
    return jsonify([r.to_dict() for r in requests]), 200


@auth_bp.route('/buy-requests/<int:id>/respond', methods=['PUT'])
@token_required
def respond_user_buy_request(current_user, id):
    from backend.models.product import BuyRequestModel
    from backend.models.admin import add_admin_notification
    
    try:
        req = BuyRequestModel.query.filter_by(id=id, user_id=int(current_user["_id"])).with_for_update().first()
        if not req:
            return jsonify({"message": "Buy request not found"}), 404
            
        data = request.get_json() or {}
        action = data.get("action") # 'Confirm' or 'Cancel'
        
        if action not in ['Confirm', 'Cancel']:
            return jsonify({"message": "Invalid action. Must be 'Confirm' or 'Cancel'."}), 400
            
        if req.status not in ['Approved', 'Awaiting Payment']:
            return jsonify({"message": f"Cannot respond to a request in status: {req.status}"}), 400
            
        if action == 'Confirm':
            req.status = 'Awaiting Payment'
            req.customer_confirmed = True
            db.session.commit()
            
            try:
                add_admin_notification(
                    title="Customer Confirmed Buy Request",
                    message=f"User {current_user['name']} confirmed approved request #{req.id} ({req.product_name}) in {req.city or 'unknown city'} and is proceeding to checkout.",
                    type="BUY_REQUEST",
                    user_id=int(current_user["_id"])
                )
            except Exception as ex:
                print("Failed to add admin notification:", ex)
                
            try:
                add_user_notification(
                    str(req.user_id),
                    "Payment Pending",
                    f"Your payment for requested product '{req.product_name}' (Qty: {req.quantity}) is pending. Please complete checkout to place order."
                )
            except Exception as ex:
                print("Failed to add user notification:", ex)
            
            return jsonify({
                "message": "Buy request confirmed! Proceeding to checkout.",
                "success": True,
                "buy_request": req.to_dict()
            }), 200
        else:
            req.status = 'Cancelled By User'
            db.session.commit()
            
            try:
                add_admin_notification(
                    title="User Cancelled Buy Request",
                    message=f"User {current_user['name']} cancelled buy request #{req.id} for '{req.product_name}'.",
                    type="BUY_REQUEST",
                    user_id=int(current_user["_id"])
                )
            except Exception as ex:
                print("Failed to add admin notification:", ex)
            
            return jsonify({
                "message": "Buy request cancelled successfully.",
                "success": True,
                "buy_request": req.to_dict()
            }), 200
    except Exception as e:
        db.session.rollback()
        print("Error responding to buy request:", e)
        return jsonify({"message": "An error occurred while responding to buy request."}), 500


@auth_bp.route('/buy-requests/<int:id>', methods=['GET'])
@token_required
def get_single_buy_request(current_user, id):
    from backend.models.product import BuyRequestModel, ProductModel
    from backend.models.user import UserModel
    from sqlalchemy.orm import joinedload, selectinload
    req = BuyRequestModel.query.options(
        joinedload(BuyRequestModel.product),
        joinedload(BuyRequestModel.user).selectinload(UserModel.addresses),
        joinedload(BuyRequestModel.converted_order),
        joinedload(BuyRequestModel.selected_address)
    ).filter_by(id=id, user_id=int(current_user["_id"])).first()
    if not req:
        return jsonify({"message": "Buy request not found"}), 404
        
    product_dict = ProductModel.find_by_id(req.product_id)
    
    return jsonify({
        "buy_request": req.to_dict(),
        "product": product_dict
    }), 200


@auth_bp.route('/buy-requests/<int:id>/payment-failed', methods=['PUT', 'POST'])
@token_required
def buy_request_payment_failed(current_user, id):
    from backend.models.product import BuyRequestModel
    try:
        req = BuyRequestModel.query.filter_by(id=id, user_id=int(current_user["_id"])).with_for_update().first()
        if not req:
            return jsonify({"message": "Buy request not found"}), 404
            
        req.status = 'Awaiting Payment'
        db.session.commit()
        
        try:
            add_user_notification(
                str(req.user_id),
                "Payment Pending",
                f"Your payment for requested product '{req.product_name}' failed or is pending. Please complete checkout to place order."
            )
        except Exception as ex:
            print("Failed to add user notification:", ex)
        
        return jsonify({
            "message": "Buy request updated to Awaiting Payment.",
            "success": True,
            "buy_request": req.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print("Error updating buy request payment failure:", e)
        return jsonify({"message": "An error occurred while updating buy request status."}), 500


@auth_bp.route('/preferred-language', methods=['PUT'])
@token_required
def update_preferred_language(current_user):
    data = request.get_json() or {}
    pref_lang = data.get("preferred_language")
    if not pref_lang or pref_lang not in ['en', 'hi']:
        return jsonify({"message": "Invalid language preference"}), 400
    
    if current_user.get("_id") == "admin_user":
        return jsonify({
            "message": "Language preference saved successfully",
            "user": {
                "id": "admin_user",
                "_id": "admin_user",
                "name": "Administrator",
                "email": "admin@SSJewellery.com",
                "is_admin": True,
                "preferred_language": pref_lang
            }
        }), 200

    try:
        user_obj = UserModel.query.with_for_update().get(int(current_user["_id"]))
        if not user_obj:
            return jsonify({"message": "User not found"}), 404
            
        user_obj.preferred_language = pref_lang
        user_obj.first_login = False
        db.session.commit()
        
        return jsonify({
            "message": "Language preference saved successfully",
            "user": user_obj.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print("Error saving language preference:", e)
        return jsonify({"message": "An error occurred while saving language preference."}), 500


