from functools import wraps
import os
from flask import request, jsonify
import jwt
from backend.models.user import UserModel

from backend.config import Config

JWT_SECRET = Config.JWT_SECRET

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(None, *args, **kwargs)
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
            if data.get("is_admin"):
                admin_id = data.get("admin_id") or data.get("user_id")
                admin_obj = None
                if admin_id and str(admin_id).isdigit():
                    from backend.models.admin import AdminModel
                    admin_obj = AdminModel.query.get(int(admin_id))
                if not admin_obj and data.get("username"):
                    from backend.models.admin import AdminModel
                    admin_obj = AdminModel.query.filter_by(username=data.get("username")).first()
                if not admin_obj:
                    from backend.models.admin import AdminModel
                    admin_obj = AdminModel.query.first()
                
                if admin_obj:
                    current_user = {
                        "_id": str(admin_obj.id),
                        "id": str(admin_obj.id),
                        "name": admin_obj.username,
                        "username": admin_obj.username,
                        "email": admin_obj.username if "@" in admin_obj.username else f"{admin_obj.username}@admin.local",
                        "is_admin": True,
                        "role": "admin"
                    }
                else:
                    current_user = {
                        "_id": str(data.get("user_id") or "1"),
                        "id": str(data.get("user_id") or "1"),
                        "name": data.get("username") or "Administrator",
                        "email": data.get("email") or "admin@admin.local",
                        "is_admin": True,
                        "role": "admin"
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
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
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
