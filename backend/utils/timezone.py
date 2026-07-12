import pytz
from datetime import datetime

def get_ist_time():
    return datetime.now(pytz.timezone('Asia/Kolkata')).replace(tzinfo=None)

def format_iso_datetime(dt):
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    if dt.tzinfo is None:
        return pytz.timezone('Asia/Kolkata').localize(dt).isoformat()
    return dt.isoformat()
