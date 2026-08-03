from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.settings import SiteSettingModel
from backend.middleware.auth import admin_required
from backend.utils.audit import log_admin_action
from backend.utils.timezone import get_ist_time

maintenance_bp = Blueprint('maintenance', __name__)

def get_maintenance_config():
    """
    Helper function to query site_settings for maintenance parameters.
    Returns a dict with maintenance_mode (bool), maintenance_message (str), enabled_by_admin (str), enabled_at (str).
    """
    try:
        mode_setting = SiteSettingModel.query.filter_by(key='maintenance_mode').first()
        msg_setting = SiteSettingModel.query.filter_by(key='maintenance_message').first()
        by_setting = SiteSettingModel.query.filter_by(key='maintenance_by').first()
        at_setting = SiteSettingModel.query.filter_by(key='maintenance_at').first()

        is_on = (mode_setting.value.lower() == 'true') if (mode_setting and mode_setting.value) else False
        msg = msg_setting.value if (msg_setting and msg_setting.value) else "The website is temporarily under maintenance. Please try again later."
        by_admin = by_setting.value if (by_setting and by_setting.value) else "Admin"
        at_time = at_setting.value if (at_setting and at_setting.value) else ""

        return {
            "maintenance_mode": is_on,
            "maintenance_message": msg,
            "enabled_by_admin": by_admin,
            "enabled_at": at_time
        }
    except Exception as e:
        db.session.rollback()
        print("[MAINTENANCE] Error fetching maintenance config:", e)
        return {
            "maintenance_mode": False,
            "maintenance_message": "The website is temporarily under maintenance. Please try again later.",
            "enabled_by_admin": "",
            "enabled_at": ""
        }

@maintenance_bp.route('/status', methods=['GET', 'OPTIONS'])
def get_maintenance_status():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    """
    Public endpoint to check maintenance mode status (used for 30s auto-refresh polling).
    """
    config = get_maintenance_config()
    return jsonify({
        "success": True,
        "maintenance_mode": config["maintenance_mode"],
        "maintenance_message": config["maintenance_message"],
        "enabled_by_admin": config["enabled_by_admin"],
        "enabled_at": config["enabled_at"]
    }), 200

@maintenance_bp.route('/toggle', methods=['POST', 'OPTIONS'])
@admin_required
def toggle_maintenance_mode():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    """
    Admin-only endpoint to enable or disable website maintenance mode.
    Only authenticated admins can execute this operation.
    """
    data = request.get_json() or {}
    mode = data.get("maintenance_mode")
    if mode is None:
        return jsonify({"success": False, "message": "maintenance_mode (boolean) is required."}), 400

    new_mode_str = "true" if bool(mode) else "false"
    custom_msg = data.get("maintenance_message") or "The website is temporarily under maintenance. Please try again later."
    current_time_str = get_ist_time().isoformat()

    # Extract admin identifier from auth header / token payload if present
    admin_identifier = "Admin"
    try:
        from backend.config import Config
        import jwt
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
            decoded = jwt.decode(token, Config.get_jwt_secret(), algorithms=["HS256"])
            admin_identifier = decoded.get("email") or decoded.get("user_id") or "Admin"
    except Exception:
        pass

    try:
        # Update or Insert maintenance_mode
        setting_mode = SiteSettingModel.query.filter_by(key='maintenance_mode').first()
        if not setting_mode:
            setting_mode = SiteSettingModel(key='maintenance_mode', value=new_mode_str)
            db.session.add(setting_mode)
        else:
            setting_mode.value = new_mode_str

        # Update or Insert maintenance_message
        setting_msg = SiteSettingModel.query.filter_by(key='maintenance_message').first()
        if not setting_msg:
            setting_msg = SiteSettingModel(key='maintenance_message', value=custom_msg)
            db.session.add(setting_msg)
        else:
            setting_msg.value = custom_msg

        # Update or Insert maintenance_by
        setting_by = SiteSettingModel.query.filter_by(key='maintenance_by').first()
        if not setting_by:
            setting_by = SiteSettingModel(key='maintenance_by', value=str(admin_identifier))
            db.session.add(setting_by)
        else:
            setting_by.value = str(admin_identifier)

        # Update or Insert maintenance_at
        setting_at = SiteSettingModel.query.filter_by(key='maintenance_at').first()
        if not setting_at:
            setting_at = SiteSettingModel(key='maintenance_at', value=current_time_str)
            db.session.add(setting_at)
        else:
            setting_at.value = current_time_str

        db.session.commit()

        status_text = "ENABLED" if bool(mode) else "DISABLED"
        log_admin_action("Maintenance Mode Toggled", "Site Settings", f"Website Maintenance Mode was {status_text} by {admin_identifier}")

        return jsonify({
            "success": True,
            "message": f"Maintenance Mode successfully {status_text.lower()}d.",
            "maintenance_mode": bool(mode),
            "maintenance_message": custom_msg,
            "enabled_by_admin": admin_identifier,
            "enabled_at": current_time_str
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to toggle maintenance mode: {str(e)}"}), 500
