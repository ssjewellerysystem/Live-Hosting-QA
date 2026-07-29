from flask import Blueprint, jsonify, request
from backend.extensions import db
from backend.models.gold_rate import GoldRateModel
from backend.models.settings import SiteSettingModel
from backend.utils.gold_rate_scheduler import IST, format_official_update_timestamp
from datetime import datetime
import json

gold_rate_bp = Blueprint('gold_rate', __name__)


@gold_rate_bp.route('', methods=['GET'])
@gold_rate_bp.route('/', methods=['GET'])
def get_gold_rate():
    """
    Returns today's latest gold & silver rates strictly from the `gold_rates` database table.
    The frontend calls ONLY this endpoint (never external APIs directly).
    """
    try:
        now_ist = datetime.now(IST)
        today_str = now_ist.strftime("%Y-%m-%d")
        
        # 1. Query latest records from `gold_rates` table
        latest_records = GoldRateModel.query.filter_by(is_latest=True).all()
        is_historical_fallback = False

        if not latest_records:
            # Fallback to the most recent stored records in gold_rates table
            latest_records = GoldRateModel.query.order_by(GoldRateModel.id.desc()).limit(10).all()
            is_historical_fallback = True

        gold_rec = next((r for r in latest_records if r.metal_type == 'gold'), None)
        silver_rec = next((r for r in latest_records if r.metal_type == 'silver'), None)

        # If records exist in gold_rates table, construct payload from database
        if gold_rec or silver_rec:
            g24 = gold_rec.price_24k if gold_rec and gold_rec.price_24k else (gold_rec.rate_per_gram if gold_rec else 14211.0)
            g22 = gold_rec.price_22k if gold_rec and gold_rec.price_22k else round(g24 * 0.916, 2)
            silver_g = silver_rec.rate_per_gram if silver_rec and silver_rec.rate_per_gram else 245.0

            effective_dt = (gold_rec.effective_date if gold_rec else None) or today_str
            official_timestamp = format_official_update_timestamp(effective_dt)

            data_payload = {
                "city": gold_rec.city if gold_rec else "Central India",
                "state": gold_rec.state if gold_rec else "Rajasthan",
                "gold": {
                    "22k_per_gram": g22,
                    "24k_per_gram": g24,
                    "22k_per_10gram": round(g22 * 10, 2),
                    "24k_per_10gram": round(g24 * 10, 2),
                    "currency": gold_rec.currency if gold_rec else "INR"
                },
                "silver": {
                    "per_gram": silver_g,
                    "per_10gram": round(silver_g * 10, 2),
                    "per_kg": round(silver_g * 1000, 2),
                    "currency": silver_rec.currency if silver_rec else "INR"
                },
                "rate_date": effective_dt,
                "updated_at": official_timestamp,
                "is_fallback": is_historical_fallback,
                "source": "database"
            }

            msg = "Showing last saved rates from database." if is_historical_fallback else "Rates fetched successfully from database."
            resp = jsonify({
                "success": True,
                "message": msg,
                "data": data_payload
            })
            resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            resp.headers["Pragma"] = "no-cache"
            resp.headers["Expires"] = "0"
            return resp, 200

        # Fallback to site_settings JSON if gold_rates table is completely empty
        setting = SiteSettingModel.query.filter_by(key='metal_rates').first()
        if setting and setting.value:
            data = json.loads(setting.value)
            data["source"] = "database_settings"
            data["updated_at"] = format_official_update_timestamp(data.get("rate_date") or today_str)
            resp = jsonify({
                "success": True,
                "message": "Rates fetched successfully from database.",
                "data": data
            })
            resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            resp.headers["Pragma"] = "no-cache"
            resp.headers["Expires"] = "0"
            return resp, 200

        # Default non-zero fallback if database is brand new
        default_payload = {
            "city": "Central India",
            "state": "Rajasthan",
            "gold": {
                "22k_per_gram": 13534.0,
                "24k_per_gram": 14211.0,
                "22k_per_10gram": 135340.0,
                "24k_per_10gram": 142110.0,
                "currency": "INR"
            },
            "silver": {
                "per_gram": 245.0,
                "per_10gram": 2450.0,
                "per_kg": 245000.0,
                "currency": "INR"
            },
            "rate_date": today_str,
            "updated_at": format_official_update_timestamp(today_str),
            "source": "default_fallback"
        }
        resp = jsonify({
            "success": True,
            "message": "Showing default rates.",
            "data": default_payload
        })
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"
        return resp, 200

    except Exception as e:
        resp = jsonify({
            "success": False,
            "message": f"Error fetching rates from database: {str(e)}",
            "data": None
        })
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return resp, 500


@gold_rate_bp.route('/refresh', methods=['POST'])
def manual_refresh_gold_rate():
    """
    Admin or manual trigger to refresh gold & silver rates immediately and save to `gold_rates` table.
    """
    try:
        from backend.utils.gold_rate_scheduler import fetch_and_store_metal_rates
        result = fetch_and_store_metal_rates(force=True)

        if result["success"]:
            return jsonify({
                "success": True,
                "message": "Rates refreshed and stored in database successfully.",
                "data": result.get("data")
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": result.get("error", "Failed to refresh rates."),
                "data": None
            }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Refresh failed: {str(e)}",
            "data": None
        }), 500
