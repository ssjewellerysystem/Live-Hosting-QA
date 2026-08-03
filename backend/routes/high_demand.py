from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.settings import SiteSettingModel
from backend.middleware.auth import admin_required
from backend.utils.audit import log_admin_action
from backend.utils.timezone import get_ist_time

high_demand_bp = Blueprint('high_demand', __name__)

def get_high_demand_config():
    """
    Helper function to query site_settings for high demand mode parameters.
    Returns a dict with high_demand_mode (bool), enabled_by_admin (str), enabled_at (str).
    """
    try:
        mode_setting = SiteSettingModel.query.filter_by(key='high_demand_mode').first()
        by_setting = SiteSettingModel.query.filter_by(key='high_demand_by').first()
        at_setting = SiteSettingModel.query.filter_by(key='high_demand_at').first()

        is_on = (mode_setting.value.lower() == 'true') if (mode_setting and mode_setting.value) else False
        by_admin = by_setting.value if (by_setting and by_setting.value) else ""
        at_time = at_setting.value if (at_setting and at_setting.value) else ""

        return {
            "high_demand_mode": is_on,
            "enabled_by_admin": by_admin,
            "enabled_at": at_time
        }
    except Exception as e:
        db.session.rollback()
        print("[HIGH_DEMAND] Error fetching high demand config:", e)
        return {
            "high_demand_mode": False,
            "enabled_by_admin": "",
            "enabled_at": ""
        }

@high_demand_bp.route('/status', methods=['GET', 'OPTIONS'])
def get_high_demand_status():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    """
    Public endpoint to check High Demand Mode status (used for client polling every 30 seconds).
    """
    config = get_high_demand_config()
    return jsonify({
        "success": True,
        "high_demand_mode": config["high_demand_mode"],
        "enabled_by_admin": config["enabled_by_admin"],
        "enabled_at": config["enabled_at"]
    }), 200

@high_demand_bp.route('/toggle', methods=['POST', 'OPTIONS'])
@admin_required
def toggle_high_demand_mode():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    """
    Admin-only endpoint to enable or disable website High Demand Mode.
    Only authenticated admins can execute this operation.
    """
    data = request.get_json() or {}
    mode = data.get("high_demand_mode")
    if mode is None:
        return jsonify({"success": False, "message": "high_demand_mode (boolean) is required."}), 400

    new_mode_str = "true" if bool(mode) else "false"
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
        # Update or Insert high_demand_mode
        setting_mode = SiteSettingModel.query.filter_by(key='high_demand_mode').first()
        if not setting_mode:
            setting_mode = SiteSettingModel(key='high_demand_mode', value=new_mode_str)
            db.session.add(setting_mode)
        else:
            setting_mode.value = new_mode_str

        # Update or Insert high_demand_by
        setting_by = SiteSettingModel.query.filter_by(key='high_demand_by').first()
        if not setting_by:
            setting_by = SiteSettingModel(key='high_demand_by', value=str(admin_identifier))
            db.session.add(setting_by)
        else:
            setting_by.value = str(admin_identifier)

        # Update or Insert high_demand_at
        setting_at = SiteSettingModel.query.filter_by(key='high_demand_at').first()
        if not setting_at:
            setting_at = SiteSettingModel(key='high_demand_at', value=current_time_str)
            db.session.add(setting_at)
        else:
            setting_at.value = current_time_str

        db.session.commit()

        status_text = "ENABLED" if bool(mode) else "DISABLED"
        log_admin_action("High Demand Mode Toggled", "Site Settings", f"Website High Demand Mode was {status_text} by {admin_identifier}")

        return jsonify({
            "success": True,
            "message": f"High Demand Mode successfully {status_text.lower()}.",
            "high_demand_mode": bool(mode),
            "enabled_by_admin": admin_identifier,
            "enabled_at": current_time_str
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to toggle high demand mode: {str(e)}"}), 500
