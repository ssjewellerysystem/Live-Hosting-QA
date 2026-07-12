import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db

def run_migration():
    with app.app_context():
        print("Starting address index migration...")
        
        # 1. Drop foreign key constraint
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses DROP FOREIGN KEY delivery_addresses_ibfk_1"))
            db.session.commit()
            print("Dropped foreign key constraint.")
        except Exception as e:
            db.session.rollback()
            print("Foreign key constraint drop skipped:", e)
            
        # 2. Drop unique index
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses DROP INDEX user_id"))
            db.session.commit()
            print("Dropped unique index user_id.")
        except Exception as e:
            db.session.rollback()
            print("Unique index user_id drop skipped:", e)
            
        # 3. Add non-unique index on user_id
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses ADD INDEX user_id_idx (user_id)"))
            db.session.commit()
            print("Added non-unique index user_id_idx.")
        except Exception as e:
            db.session.rollback()
            print("Index user_id_idx add skipped:", e)
            
        # 4. Restore foreign key constraint
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses ADD CONSTRAINT delivery_addresses_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE"))
            db.session.commit()
            print("Restored foreign key constraint.")
        except Exception as e:
            db.session.rollback()
            print("Foreign key constraint restore failed:", e)
            
        # 5. Add house_number column
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses ADD COLUMN house_number VARCHAR(100) DEFAULT ''"))
            db.session.commit()
            print("Added house_number column.")
        except Exception as e:
            db.session.rollback()
            print("house_number column check:", e)
            
        # 6. Add building_name column
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses ADD COLUMN building_name VARCHAR(100) DEFAULT ''"))
            db.session.commit()
            print("Added building_name column.")
        except Exception as e:
            db.session.rollback()
            print("building_name column check:", e)
            
        # 7. Add area column
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses ADD COLUMN area VARCHAR(255) DEFAULT ''"))
            db.session.commit()
            print("Added area column.")
        except Exception as e:
            db.session.rollback()
            print("area column check:", e)
            
        # 8. Add landmark column
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses ADD COLUMN landmark VARCHAR(255) DEFAULT ''"))
            db.session.commit()
            print("Added landmark column.")
        except Exception as e:
            db.session.rollback()
            print("landmark column check:", e)
            
        # 9. Add address_type column
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses ADD COLUMN address_type VARCHAR(50) DEFAULT 'Home'"))
            db.session.commit()
            print("Added address_type column.")
        except Exception as e:
            db.session.rollback()
            print("address_type column check:", e)
            
        # 10. Add is_default column
        try:
            db.session.execute(db.text("ALTER TABLE delivery_addresses ADD COLUMN is_default BOOLEAN DEFAULT FALSE"))
            db.session.commit()
            print("Added is_default column.")
        except Exception as e:
            db.session.rollback()
            print("is_default column check:", e)
            
        # 11. Mark all existing addresses as default
        try:
            db.session.execute(db.text("UPDATE delivery_addresses SET is_default = TRUE"))
            db.session.commit()
            print("Set existing addresses as default.")
        except Exception as e:
            db.session.rollback()
            print("Failed to set existing addresses as default:", e)
            
        print("Address migration completed successfully!")

if __name__ == '__main__':
    run_migration()
