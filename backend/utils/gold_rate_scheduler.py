"""
Gold & Silver Rate Scheduler & RapidAPI Integration
---------------------------------------------------
- Timezone: Asia/Kolkata (IST)
- Scheduled Run: Exactly once daily at 09:00:00 AM IST
- API Source: RapidAPI (gold-silver-live-price-india) for Jaipur (Rajasthan)
- Transactions: Single atomic PostgreSQL transaction for both Gold and Silver
- Failures: If API request or parsing fails, roll back transaction and retain previous day's rates.
- Deduplication: Unique tracking by (effective_date, metal_type).
- Logging: Verbose logs for time, timezone, request, raw response, parsing, DB transaction, commit/rollback.
"""

import os
import json
import time
import threading
import urllib.request
import urllib.error
import pytz
from datetime import datetime, date
from backend.extensions import db
from backend.models.settings import SiteSettingModel
from backend.models.gold_rate import GoldRateModel
from backend.config import Config

# Configuration
RAPIDAPI_HOST = "gold-silver-live-price-india.p.rapidapi.com"
CITY = "Jaipur"
STATE = "Rajasthan"
IST = pytz.timezone("Asia/Kolkata")
FETCH_HOUR_IST = 9
FETCH_MINUTE_IST = 0

_scheduler_lock = threading.Lock()
_scheduler_started = False
_last_processed_date = None


def get_rapid_api_key():
    return Config.RAPID_API_KEY or os.environ.get("RAPIDAPI_KEY", "035bac519fmsh0a6d0f6755a8814p16eab0jsn9e0527c5c3d0")


def format_official_update_timestamp(eff_date=None):
    """
    Formats the official daily rate update timestamp as: '<DD> <Month> <YYYY>, 09:00 AM IST'
    (e.g., '25 July 2026, 09:00 AM IST').
    """
    if not eff_date:
        eff_date = datetime.now(IST).date()
    elif isinstance(eff_date, str):
        try:
            eff_date = datetime.strptime(eff_date, "%Y-%m-%d").date()
        except Exception:
            eff_date = datetime.now(IST).date()
    elif isinstance(eff_date, datetime):
        eff_date = eff_date.date()

    return f"{eff_date.day} {eff_date.strftime('%B %Y')}, 09:00 AM IST"


def _parse_gold_response(data_json, city=CITY):
    """
    Parses 24K and 22K gold rates per gram from RapidAPI response dictionary or list.
    Returns (price_24k, price_22k) as floats if valid, or (None, None).
    """
    g24, g22 = None, None

    if isinstance(data_json, list) and len(data_json) > 0:
        target = None
        for item in data_json:
            if isinstance(item, dict):
                c_name = str(item.get("city") or item.get("location") or "").lower()
                if c_name == city.lower():
                    target = item
                    break
        if not target and isinstance(data_json[0], dict):
            target = data_json[0]
        data_json = target or {}

    if isinstance(data_json, dict):
        city_clean = city.strip()
        keys_24k = [
            f"{city_clean}_24k", f"{city_clean.lower()}_24k", f"{city_clean}_gold_24k",
            "24k", "gold_24k", "price_24k", "24_carat", "rate_24k", "per_gram_24k"
        ]
        keys_22k = [
            f"{city_clean}_22k", f"{city_clean.lower()}_22k", f"{city_clean}_gold_22k",
            "22k", "gold_22k", "price_22k", "22_carat", "rate_22k", "per_gram_22k"
        ]

        for k in keys_24k:
            if k in data_json and data_json[k] is not None:
                try:
                    val = float(data_json[k])
                    if val > 0:
                        g24 = val
                        break
                except (ValueError, TypeError):
                    pass

        for k in keys_22k:
            if k in data_json and data_json[k] is not None:
                try:
                    val = float(data_json[k])
                    if val > 0:
                        g22 = val
                        break
                except (ValueError, TypeError):
                    pass

        if g24 and not g22:
            g22 = round(g24 * 0.916, 2)
        elif g22 and not g24:
            g24 = round(g22 / 0.916, 2)

    return g24, g22


def _parse_silver_response(data_json, city=CITY):
    """
    Parses 1g silver rate from RapidAPI response dictionary or list.
    Returns silver_per_gram as float if valid, or None.
    """
    silver = None

    if isinstance(data_json, list) and len(data_json) > 0:
        target = None
        for item in data_json:
            if isinstance(item, dict):
                c_name = str(item.get("city") or item.get("location") or "").lower()
                if c_name == city.lower():
                    target = item
                    break
        if not target and isinstance(data_json[0], dict):
            target = data_json[0]
        data_json = target or {}

    if isinstance(data_json, dict):
        city_clean = city.strip()
        keys_silver = [
            f"{city_clean}_1g", f"{city_clean.lower()}_1g", f"{city_clean}_silver",
            "1g", "silver_1g", "price_1g", "silver", "silver_per_gram", "rate_per_gram", "per_gram", "rate"
        ]
        for k in keys_silver:
            if k in data_json and data_json[k] is not None:
                try:
                    val = float(data_json[k])
                    if val > 0:
                        silver = val
                        break
                except (ValueError, TypeError):
                    pass

    return silver


def fetch_and_store_metal_rates(force=False):
    """
    Fetches live metal rates from RapidAPI and updates PostgreSQL database within a SINGLE atomic transaction.
    Respects Config.ENABLE_RAPID_API feature flag.
    """
    if not Config.ENABLE_RAPID_API:
        print(f"[GOLD-SCHEDULER LOG] RapidAPI fetch skipped: ENABLE_RAPID_API feature flag is OFF in {Config.ENVIRONMENT} mode.")
        return {"success": False, "error": "RapidAPI disabled by feature flag"}

    now_ist = datetime.now(IST)
    today_str = now_ist.strftime("%Y-%m-%d")
    
    print(f"\n[GOLD-SCHEDULER LOG] ============================================================")
    print(f"[GOLD-SCHEDULER LOG] Execution Time: {now_ist.strftime('%Y-%m-%d %H:%M:%S')} IST")
    print(f"[GOLD-SCHEDULER LOG] Environment: {Config.ENVIRONMENT}")
    print(f"[GOLD-SCHEDULER LOG] Timezone: Asia/Kolkata (IST)")
    print(f"[GOLD-SCHEDULER LOG] City: {CITY}, State: {STATE}")
    print(f"[GOLD-SCHEDULER LOG] Force Update: {force}")
    print(f"[GOLD-SCHEDULER LOG] ============================================================")

    headers = {
        "Content-Type": "application/json",
        "city": CITY,
        "required-date-yyyy-mm-dd": today_str,
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": get_rapid_api_key(),
    }

    g24_val, g22_val, silver_val = None, None, None

    # --- 1. Fetch Gold Rate ---
    gold_endpoints = [
        f"https://{RAPIDAPI_HOST}/gold_historical_price_india_city_value/",
        f"https://{RAPIDAPI_HOST}/gold_live_price_india/"
    ]
    
    for url in gold_endpoints:
        try:
            print(f"[GOLD-SCHEDULER LOG] Sending RapidAPI Gold Request to: {url}")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw_body = resp.read().decode('utf-8')
                print(f"[GOLD-SCHEDULER LOG] RapidAPI Gold HTTP Status: {resp.status}")
                print(f"[GOLD-SCHEDULER LOG] Complete Raw Gold API Response: {raw_body}")
                if resp.status == 200:
                    gold_json = json.loads(raw_body)
                    g24, g22 = _parse_gold_response(gold_json, CITY)
                    if g24 and g22:
                        g24_val, g22_val = g24, g22
                        print(f"[GOLD-SCHEDULER LOG] ✓ Successfully Parsed Gold: 24K=₹{g24_val}/g, 22K=₹{g22_val}/g")
                        break
        except urllib.error.HTTPError as he:
            print(f"[GOLD-SCHEDULER LOG] ❌ RapidAPI Gold HTTP Error {he.code}: {he.reason}")
        except Exception as ex:
            print(f"[GOLD-SCHEDULER LOG] ❌ Error requesting Gold rate from {url}: {ex}")

    # --- 2. Fetch Silver Rate ---
    silver_endpoints = [
        f"https://{RAPIDAPI_HOST}/silver_historical_price_india_city_value/",
        f"https://{RAPIDAPI_HOST}/silver_live_price_india/"
    ]

    for url in silver_endpoints:
        try:
            print(f"[GOLD-SCHEDULER LOG] Sending RapidAPI Silver Request to: {url}")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                raw_body = resp.read().decode('utf-8')
                print(f"[GOLD-SCHEDULER LOG] RapidAPI Silver HTTP Status: {resp.status}")
                print(f"[GOLD-SCHEDULER LOG] Complete Raw Silver API Response: {raw_body}")
                if resp.status == 200:
                    silver_json = json.loads(raw_body)
                    s_val = _parse_silver_response(silver_json, CITY)
                    if s_val:
                        silver_val = s_val
                        print(f"[GOLD-SCHEDULER LOG] ✓ Successfully Parsed Silver: ₹{silver_val}/g")
                        break
        except urllib.error.HTTPError as he:
            print(f"[GOLD-SCHEDULER LOG] ❌ RapidAPI Silver HTTP Error {he.code}: {he.reason}")
        except Exception as ex:
            print(f"[GOLD-SCHEDULER LOG] ❌ Error requesting Silver rate from {url}: {ex}")

    # --- 3. Validate Live API Fetch Result (NO HARDCODED FALLBACK INSERTS) ---
    if not g24_val or not g22_val or not silver_val:
        print(f"[GOLD-SCHEDULER WARNING] ⚠️ RapidAPI fetch or JSON parsing failed for date {today_str}.")
        print(f"[GOLD-SCHEDULER WARNING] Parsed state -> Gold 24K: {g24_val}, Gold 22K: {g22_val}, Silver: {silver_val}.")
        print(f"[GOLD-SCHEDULER WARNING] 🛑 REJECTING DATABASE UPDATE: Hardcoded/dummy fallbacks will NOT be inserted into database.")
        print(f"[GOLD-SCHEDULER WARNING] Retaining previous verified rates in gold_rates table.")
        return {
            "success": False,
            "error": f"RapidAPI rates unavailable for {today_str}. Retaining previous verified rates."
        }

    # --- 4. Database Single Transaction Upsert ---
    try:
        print(f"[GOLD-SCHEDULER LOG] Starting Atomic PostgreSQL Database Transaction for date {today_str}...")

        # Step A: Mark all older records as is_latest = False
        GoldRateModel.query.update({GoldRateModel.is_latest: False})

        # Step B: Upsert Gold Record for today using unique key (effective_date, metal_type)
        existing_gold = GoldRateModel.query.filter_by(effective_date=today_str, metal_type='gold').first()
        if existing_gold:
            existing_gold.rate_per_gram = g24_val
            existing_gold.price_24k = g24_val
            existing_gold.price_22k = g22_val
            existing_gold.price_18k = round(g24_val * 0.75, 2)
            existing_gold.price_14k = round(g24_val * 0.585, 2)
            existing_gold.fetched_at = datetime.utcnow()
            existing_gold.is_latest = True
            print(f"[GOLD-SCHEDULER LOG] Updated existing Gold record (ID: {existing_gold.id}) for date {today_str}.")
        else:
            new_gold = GoldRateModel(
                metal_type='gold',
                purity='24k',
                city=CITY,
                state=STATE,
                rate_per_gram=g24_val,
                price_24k=g24_val,
                price_22k=g22_val,
                price_18k=round(g24_val * 0.75, 2),
                price_14k=round(g24_val * 0.585, 2),
                currency='INR',
                source='RapidAPI',
                effective_date=today_str,
                fetched_at=datetime.utcnow(),
                is_latest=True
            )
            db.session.add(new_gold)
            print(f"[GOLD-SCHEDULER LOG] Created new Gold record for date {today_str}.")

        # Step C: Upsert Silver Record for today using unique key (effective_date, metal_type)
        existing_silver = GoldRateModel.query.filter_by(effective_date=today_str, metal_type='silver').first()
        if existing_silver:
            existing_silver.rate_per_gram = silver_val
            existing_silver.fetched_at = datetime.utcnow()
            existing_silver.is_latest = True
            print(f"[GOLD-SCHEDULER LOG] Updated existing Silver record (ID: {existing_silver.id}) for date {today_str}.")
        else:
            new_silver = GoldRateModel(
                metal_type='silver',
                purity='1g',
                city=CITY,
                state=STATE,
                rate_per_gram=silver_val,
                currency='INR',
                source='RapidAPI',
                effective_date=today_str,
                fetched_at=datetime.utcnow(),
                is_latest=True
            )
            db.session.add(new_silver)
            print(f"[GOLD-SCHEDULER LOG] Created new Silver record for date {today_str}.")

        # Step D: Update metal_rates in SiteSettingModel as secondary payload
        payload = {
            "city": CITY,
            "state": STATE,
            "gold": {
                "22k_per_gram": g22_val,
                "24k_per_gram": g24_val,
                "22k_per_10gram": round(g22_val * 10, 2),
                "24k_per_10gram": round(g24_val * 10, 2),
                "currency": "INR"
            },
            "silver": {
                "per_gram": silver_val,
                "per_10gram": round(silver_val * 10, 2),
                "per_kg": round(silver_val * 1000, 2),
                "currency": "INR"
            },
            "rate_date": today_str,
            "updated_at": format_official_update_timestamp(today_str),
            "updated_at_iso": now_ist.isoformat(),
        }

        setting = SiteSettingModel.query.filter_by(key='metal_rates').first()
        if setting:
            setting.value = json.dumps(payload)
        else:
            setting = SiteSettingModel(key='metal_rates', value=json.dumps(payload))
            db.session.add(setting)

        # Step E: Commit Atomic Transaction
        db.session.commit()
        print(f"[GOLD-SCHEDULER SUCCESS] ✅ Database transaction COMMITTED successfully.")
        print(f"[GOLD-SCHEDULER SUCCESS] Live stored values -> Gold 24K: ₹{g24_val}/g, 22K: ₹{g22_val}/g | Silver: ₹{silver_val}/g")
        return {"success": True, "data": payload}

    except Exception as db_err:
        db.session.rollback()
        print(f"[GOLD-SCHEDULER ERROR] ❌ Database transaction ROLLED BACK due to error: {db_err}")
        return {"success": False, "error": str(db_err)}


def _scheduler_loop(app):
    """
    Background daemon loop that checks IST time and executes ONLY ONCE at 09:00:00 AM IST daily.
    """
    global _last_processed_date
    print(f"[GOLD-SCHEDULER LOG] 🟢 Scheduler loop active. Configured target: {FETCH_HOUR_IST:02d}:{FETCH_MINUTE_IST:02d} AM IST daily.")

    while True:
        try:
            now_ist = datetime.now(IST)
            today_date = now_ist.date()

            # Execute strictly at 9:00 AM IST once per day
            if now_ist.hour == FETCH_HOUR_IST and now_ist.minute == FETCH_MINUTE_IST:
                if _last_processed_date != today_date:
                    print(f"[GOLD-SCHEDULER LOG] ⏰ 09:00 AM IST Trigger Fired for {today_date}!")
                    with app.app_context():
                        result = fetch_and_store_metal_rates()
                        if result["success"]:
                            _last_processed_date = today_date
                            print(f"[GOLD-SCHEDULER LOG] Daily 09:00 AM IST update complete for {today_date}.")
                        else:
                            print(f"[GOLD-SCHEDULER LOG] Update attempt failed. Will retry in next scheduler cycle.")
                    # Sleep 70 seconds to ensure the 09:00 AM minute window passes before next loop evaluation
                    time.sleep(70)
                    continue

            time.sleep(30)
        except Exception as e:
            print(f"[GOLD-SCHEDULER ERROR] ❌ Error in scheduler loop: {e}")
            time.sleep(30)


def start_gold_rate_scheduler(app):
    """
    Initializes the daily Gold & Silver Rate Scheduler thread.
    Guaranteed singleton initialization. Does NOT perform arbitrary startup fetches outside 09:00 AM IST.
    """
    global _scheduler_started
    with _scheduler_lock:
        if _scheduler_started:
            print("[GOLD-SCHEDULER LOG] ℹ️ Scheduler thread already running. Skipping duplicate initialization.")
            return

        # In Flask debug mode, prevent reloader child process duplicate thread
        if os.environ.get("WERKZEUG_RUN_MAIN") != "true" and app.debug:
            print("[GOLD-SCHEDULER LOG] ℹ️ Werkzeug main process check skipped scheduler initialization.")
            return

        _scheduler_started = True

    now_ist = datetime.now(IST)
    print(f"[GOLD-SCHEDULER LOG] Initializing Gold & Silver Rate Scheduler at {now_ist.strftime('%Y-%m-%d %H:%M:%S')} IST.")
    
    thread = threading.Thread(
        target=_scheduler_loop,
        args=(app,),
        name="GoldRateScheduler",
        daemon=True
    )
    thread.start()
    print("[GOLD-SCHEDULER LOG] 🟢 Gold Rate Scheduler thread started successfully (daemon=True).")
