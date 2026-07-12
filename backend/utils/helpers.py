import re
import random
import os
from datetime import datetime, timedelta
import pytz
from backend.extensions import db
from backend.models.otp_verification import OTPVerification
from backend.utils.timezone import get_ist_time

def safe_print(*args, **kwargs):
    try:
        print(*args, **kwargs)
    except Exception:
        pass

def generate_otp(identifier):
    """
    Generates a 6-digit OTP, stores it in the database with 5 minutes validity, and returns it.
    Supports local development mode.
    """
    otp_mode = os.getenv("OTP_MODE", "development").lower()
    
    # In development mode, we can use 123456 as a fixed fallback, or generate a random 6-digit OTP.
    # Let's generate a random 6-digit OTP by default, but allow fixed if desired.
    otp = str(random.randint(100000, 999999))
    expires_at = get_ist_time() + timedelta(minutes=5)
    
    # Check if there is an existing OTP for this identifier
    record = OTPVerification.query.filter_by(identifier=identifier).first()
    if record:
        record.otp = otp
        record.expires_at = expires_at
        record.status = 'pending'
    else:
        record = OTPVerification(
            identifier=identifier,
            otp=otp,
            expires_at=expires_at,
            status='pending'
        )
        db.session.add(record)
        
    db.session.commit()
    
    # Display OTP in Flask terminal logs
    safe_print(f"\n[OTP SYSTEM] [{otp_mode.upper()} MODE] Generated OTP for '{identifier}': {otp} (Expires in 5 minutes)")
    safe_print(f"Generated OTP: {otp}\n")
    
    return otp

def verify_otp(identifier, submitted_otp):
    """
    Verifies if the submitted OTP matches the stored OTP in the database and is not expired.
    """
    otp_mode = os.getenv("OTP_MODE", "development").lower()
    
    # In development mode, we also allow the standard master OTP '123456' for easier testing
    if otp_mode == "development" and str(submitted_otp) == "123456":
        safe_print(f"[OTP SYSTEM] Development Mode bypass: verified using master OTP 123456 for '{identifier}'")
        return True
        
    record = OTPVerification.query.filter_by(identifier=identifier).first()
    if not record:
        return False
        
    # Check expiry (comparing naive datetimes in IST)
    current_time_ist_naive = get_ist_time().replace(tzinfo=None)
    if current_time_ist_naive > record.expires_at:
        try:
            db.session.delete(record)
            db.session.commit()
        except Exception:
            db.session.rollback()
        return False
        
    if record.otp == str(submitted_otp):
        try:
            record.status = 'verified'
            db.session.commit()
        except Exception:
            db.session.rollback()
            return False
        return True
        
    return False

def is_valid_email(email):
    """
    Simple email validation.
    """
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None
