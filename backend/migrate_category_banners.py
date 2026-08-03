import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db
from backend.models.category_banner import CategoryBanner

def run_migration():
    print("[MIGRATION] Starting category_banners migration...")
    with app.app_context():
        try:
            # db.create_all will safely create category_banners table if missing
            db.create_all()
            print("[MIGRATION] Successfully executed db.create_all() for category_banners.")
        except Exception as e:
            print("[MIGRATION] Error executing db.create_all():", e)

        # Extra sanity check using SQL query
        try:
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            if 'category_banners' in tables:
                print("[MIGRATION] Verified: 'category_banners' table exists in database!")
            else:
                print("[MIGRATION] Warning: 'category_banners' table was not detected by inspector.")
        except Exception as e:
            print("[MIGRATION] Inspection check error:", e)

if __name__ == '__main__':
    run_migration()
