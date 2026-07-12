from functools import wraps
import os
from flask import request, jsonify
import jwt
from backend.models.user import UserModel

JWT_SECRET = os.getenv("JWT_SECRET", "supersecret_SSJewellery_key_123")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check for Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"message": "Authentication token is missing!"}), 401
        
        try:
            # Decode token
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            if data.get("user_id") == "admin_user" and data.get("is_admin"):
                current_user = {
                    "_id": "admin_user",
                    "name": "Administrator",
                    "email": "admin@SSJewellery.com",
                    "is_admin": True
                }
            else:
                current_user = UserModel.find_by_id(data['user_id'])
            if not current_user:
                return jsonify({"message": "User not found or disabled!"}), 401
            if current_user.get("is_blocked"):
                return jsonify({"message": "Your account has been suspended by the administrator."}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired! Please login again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token! Please login again."}), 401
        except Exception as e:
            return jsonify({"message": f"Authentication error: {str(e)}"}), 401
            
        return f(current_user, *args, **kwargs)
        
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
                
        if not token:
            return jsonify({"message": "Authentication token is missing!"}), 401
            
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            if data.get("is_admin", False) is True:
                # Valid token containing admin flag bypasses ObjectId lookup
                return f(*args, **kwargs)
                
            current_user = UserModel.find_by_id(data['user_id'])
            if not current_user or not current_user.get("is_admin", False):
                return jsonify({"message": "Access denied! Admin privileges required."}), 403
        except Exception as e:
            return jsonify({"message": "Access denied! Invalid authentication token."}), 403
            
        return f(*args, **kwargs)
        
    return decorated
