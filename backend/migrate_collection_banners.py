import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db
from backend.models.collection_banner import CollectionBanner

def run_migration():
    print("[MIGRATION] Starting collection_banners migration...")
    with app.app_context():
        try:
            db.create_all()
            print("[MIGRATION] Successfully executed db.create_all() for collection_banners.")
        except Exception as e:
            print("[MIGRATION] Error executing db.create_all():", e)

        try:
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            if 'collection_banners' in tables:
                print("[MIGRATION] Verified: 'collection_banners' table exists in database!")
            else:
                print("[MIGRATION] Warning: 'collection_banners' table was not detected by inspector.")
        except Exception as e:
            print("[MIGRATION] Inspection check error:", e)

if __name__ == '__main__':
    run_migration()
