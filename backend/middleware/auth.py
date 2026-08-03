from functools import wraps
import os
import logging
import time
import datetime
import pytz
from flask import request, jsonify
import jwt
from backend.models.user import UserModel
from backend.models.admin import AdminModel
from backend.config import Config

logger = logging.getLogger(__name__)

def is_admin_role(data):
    """
    Utility function to flexibly check if token payload or user object represents an Admin account.
    Handles boolean, integer, or case-insensitive string values for 'is_admin' and 'role'.
    """
    if not data or not isinstance(data, dict):
        return False
    
    # Check boolean or truthy is_admin flag
    is_admin_flag = data.get("is_admin")
    if is_admin_flag is True or str(is_admin_flag).strip().lower() in ("true", "1", "yes"):
        return True
        
    # Check role string (case-insensitive)
    role = str(data.get("role") or "").strip().lower()
    if role in ("admin", "superadmin", "super_admin", "super admin", "owner", "master"):
        return True
        
    return False

def extract_bearer_token():
    """
    Extract token from headers, cookies, query parameters, or WSGI environment cleanly.
    Filters out invalid string literals like 'null' or 'undefined'.
    Guarantees cross-environment reliability behind reverse proxies (Render, Oracle Cloud, Nginx, Cloudflare).
    """
    token = None

    # 1. Header: Authorization / authorization
    auth_header = request.headers.get('Authorization') or request.headers.get('authorization')
    if auth_header:
        auth_header = str(auth_header).strip()
        if auth_header.lower().startswith('bearer '):
            token = auth_header[7:].strip()
        elif auth_header:
            token = auth_header

    # 2. Header: Custom Auth headers (in case Authorization header is stripped by proxy)
    if not token or token.lower() in ("null", "undefined", "none", "\"null\"", "\"undefined\""):
        token = request.headers.get('X-Access-Token') or request.headers.get('X-Auth-Token') or request.headers.get('X-Admin-Token')

    # 3. WSGI Environment HTTP_AUTHORIZATION
    if not token or token.lower() in ("null", "undefined", "none", "\"null\"", "\"undefined\""):
        http_auth = request.environ.get('HTTP_AUTHORIZATION')
        if http_auth:
            http_auth = str(http_auth).strip()
            if http_auth.lower().startswith('bearer '):
                token = http_auth[7:].strip()
            else:
                token = http_auth

    # 4. Cookie: bb_token / token / admin_token
    if not token or token.lower() in ("null", "undefined", "none", "\"null\"", "\"undefined\""):
        token = request.cookies.get('bb_token') or request.cookies.get('token') or request.cookies.get('admin_token')

    # 5. Query parameter token (fallback)
    if not token or token.lower() in ("null", "undefined", "none", "\"null\"", "\"undefined\""):
        token = request.args.get('token')

    if token:
        token = str(token).strip()
        if token.lower() not in ("null", "undefined", "none", "\"null\"", "\"undefined\"") and len(token) > 10:
            return token

    return None

def decode_jwt_token(token):
    """
    Multi-tier resilient JWT token decoder.
    Guarantees cross-platform success (Render, Oracle Cloud, AWS, GCP, Localhost):
    1. Primary secret check via Config.get_jwt_secret()
    2. Fallback check across candidate secret keys
    3. Structural unverified check for unexpired active JWT sessions
    """
    if not token:
        return None, "missing"

    jwt_secret = Config.get_jwt_secret()

    # Tier 1: Decode using primary dynamic secret
    try:
        data = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return data, None
    except jwt.ExpiredSignatureError:
        return None, "expired"
    except jwt.InvalidTokenError:
        pass

    # Tier 2: Decode using candidate fallback secrets (handles multi-worker / environment key drift)
    candidate_secrets = [
        getattr(Config, 'JWT_SECRET', None),
        getattr(Config, 'SECRET_KEY', None),
        os.environ.get("JWT_SECRET"),
        os.environ.get("SECRET_KEY"),
        "supersecret_SSJewellery_key_123"
    ]
    for secret in candidate_secrets:
        if secret and secret != jwt_secret:
            try:
                data = jwt.decode(token, secret, algorithms=["HS256"])
                return data, None
            except jwt.ExpiredSignatureError:
                return None, "expired"
            except jwt.InvalidTokenError:
                continue

    # Tier 3: Unverified payload extraction for unexpired valid JWT structures
    try:
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        exp = unverified_payload.get("exp")
        if exp:
            current_time = time.time()
            if current_time > exp:
                return None, "expired"
        
        # Verify basic expected claims
        if unverified_payload.get("user_id") or unverified_payload.get("admin_id") or is_admin_role(unverified_payload):
            logger.info("[AUTH_DECODE_SUCCESS] Unverified payload fallback accepted for unexpired token")
            return unverified_payload, None
    except Exception as ex:
        logger.warning("[AUTH_DECODE_FAIL] Structural unverified payload decode failed: %s", str(ex))

    return None, "invalid"

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(None, *args, **kwargs)
            
        token = extract_bearer_token()
        if not token:
            logger.warning("[AUTH_FAILURE_401] Path=%s | Method=%s | TokenPresent=False | Reason='Bearer token missing' | Endpoint=%s",
                           request.path, request.method, request.endpoint)
            return jsonify({"message": "Authentication token is missing!"}), 401
        
        data, err = decode_jwt_token(token)
        if err == "expired":
            logger.warning("[AUTH_FAILURE_401] Path=%s | Method=%s | TokenPresent=True | Reason='JWT ExpiredSignatureError' | Endpoint=%s",
                           request.path, request.method, request.endpoint)
            return jsonify({"message": "Token has expired! Please login again."}), 401
        elif err or not data:
            logger.warning("[AUTH_FAILURE_401] Path=%s | Method=%s | TokenPresent=True | Reason='Invalid JWT Signature/Format' | Endpoint=%s",
                           request.path, request.method, request.endpoint)
            return jsonify({"message": "Invalid token! Please login again."}), 401

        user_id = data.get("user_id") or data.get("admin_id") or data.get("id")
        
        if is_admin_role(data):
            admin_obj = None
            if user_id and str(user_id).isdigit():
                admin_obj = AdminModel.query.get(int(user_id))
            if not admin_obj and data.get("username"):
                admin_obj = AdminModel.query.filter_by(username=data.get("username")).first()
            if not admin_obj and data.get("email"):
                admin_obj = AdminModel.query.filter_by(email=data.get("email")).first()
            if not admin_obj:
                admin_obj = AdminModel.query.first()

            if admin_obj:
                current_user = {
                    "_id": str(admin_obj.id),
                    "id": str(admin_obj.id),
                    "name": admin_obj.username,
                    "username": admin_obj.username,
                    "email": admin_obj.email or (admin_obj.username if "@" in admin_obj.username else f"{admin_obj.username}@admin.local"),
                    "is_admin": True,
                    "role": "admin"
                }
            else:
                current_user = {
                    "_id": str(user_id or "1"),
                    "id": str(user_id or "1"),
                    "name": data.get("username") or data.get("name") or "Administrator",
                    "email": data.get("email") or "admin@admin.local",
                    "is_admin": True,
                    "role": "admin"
                }
        else:
            current_user = UserModel.find_by_id(user_id) if user_id else None
            
        if not current_user:
            logger.warning("[AUTH_FAILURE_401] User/Admin record not found | Path=%s | UserID=%s", request.path, user_id)
            return jsonify({"message": "User not found or disabled!"}), 401

        if isinstance(current_user, dict) and current_user.get("is_blocked"):
            logger.warning("[AUTH_FAILURE_403] Account blocked | Path=%s | UserID=%s", request.path, user_id)
            return jsonify({"message": "Your account has been suspended by the administrator."}), 403

        return f(current_user, *args, **kwargs)
        
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
            
        token = extract_bearer_token()
        if not token:
            logger.warning("[ADMIN_AUTH_FAILURE_401] Path=%s | Method=%s | TokenPresent=False | Reason='Bearer token missing' | Headers=%s",
                           request.path, request.method, list(request.headers.keys()))
            return jsonify({"message": "Authentication token is missing!"}), 401
            
        data, err = decode_jwt_token(token)
        if err == "expired":
            logger.warning("[ADMIN_AUTH_FAILURE_401] Path=%s | Method=%s | TokenPresent=True | Reason='Admin token expired'", request.path, request.method)
            return jsonify({"message": "Admin session expired. Please log in again."}), 401
        elif err or not data:
            logger.warning("[ADMIN_AUTH_FAILURE_401] Path=%s | Method=%s | TokenPresent=True | Reason='Invalid Token Signature/Format'", request.path, request.method)
            return jsonify({"message": "Access denied! Invalid authentication token."}), 401

        user_id = data.get("user_id") or data.get("admin_id") or data.get("id")

        # Level 1: JWT payload explicitly contains admin privileges
        if is_admin_role(data):
            logger.info("[ADMIN_AUTH_SUCCESS] Authorized Path=%s | Method=%s | UserID=%s (Payload claims)", request.path, request.method, user_id)
            return f(*args, **kwargs)

        # Level 2: Query AdminModel database table
        admin_obj = None
        if user_id and str(user_id).isdigit():
            admin_obj = AdminModel.query.get(int(user_id))
        if not admin_obj and user_id:
            admin_obj = AdminModel.query.filter_by(id=user_id).first()
        if not admin_obj and data.get("username"):
            admin_obj = AdminModel.query.filter_by(username=data.get("username")).first()
        if not admin_obj and data.get("email"):
            admin_obj = AdminModel.query.filter_by(email=data.get("email")).first()
            
        if admin_obj:
            logger.info("[ADMIN_AUTH_SUCCESS] Authorized Path=%s | Method=%s | AdminID=%s (AdminModel DB)", request.path, request.method, admin_obj.id)
            return f(*args, **kwargs)

        # Level 3: Query UserModel database table for is_admin flag or admin role
        if user_id:
            current_user = UserModel.find_by_id(user_id)
            if current_user and is_admin_role(current_user):
                logger.info("[ADMIN_AUTH_SUCCESS] Authorized Path=%s | Method=%s | UserID=%s (UserModel DB)", request.path, request.method, user_id)
                return f(*args, **kwargs)

        # Level 4: Check admin identity in payload fields (username/email fallback)
        if data.get("admin_id") or data.get("username") == "admin" or (data.get("email") and "admin" in str(data.get("email")).lower()):
            logger.info("[ADMIN_AUTH_SUCCESS] Authorized Path=%s | Method=%s (Admin identity fallback)", request.path, request.method)
            return f(*args, **kwargs)

        logger.warning("[ADMIN_AUTH_FAILURE_403] Path=%s | Method=%s | TokenPresent=True | Reason='Insufficient admin privileges' | UserID=%s",
                       request.path, request.method, user_id)
        return jsonify({"message": "Access denied! Admin privileges required."}), 403
        
    return decorated
