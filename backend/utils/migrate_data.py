import os
import sys
import json

# Set up project path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.app import app
from backend.extensions import db
from backend.utils.security import encrypt

def migrate_database():
    print("Initiating SSJewellery Database PII Security Migration...")
    
    with app.app_context():
        # 1. SCHEMA MIGRATION: Expand column lengths to fit encrypted ciphertexts
        print("Performing schema migration (ALTER TABLE queries)...")
        alter_queries = [
            # users
            "ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL;",
            "ALTER TABLE users MODIFY COLUMN full_name VARCHAR(255) NOT NULL;",
            "ALTER TABLE users MODIFY COLUMN phone VARCHAR(255) NULL;",
            
            # delivery_addresses
            "ALTER TABLE delivery_addresses MODIFY COLUMN house_number VARCHAR(255) NULL;",
            "ALTER TABLE delivery_addresses MODIFY COLUMN building_name VARCHAR(255) NULL;",
            "ALTER TABLE delivery_addresses MODIFY COLUMN street VARCHAR(500) NULL;",
            "ALTER TABLE delivery_addresses MODIFY COLUMN area VARCHAR(500) NULL;",
            "ALTER TABLE delivery_addresses MODIFY COLUMN landmark VARCHAR(500) NULL;",
            "ALTER TABLE delivery_addresses MODIFY COLUMN city VARCHAR(255) NULL;",
            "ALTER TABLE delivery_addresses MODIFY COLUMN state VARCHAR(255) NULL;",
            "ALTER TABLE delivery_addresses MODIFY COLUMN pincode VARCHAR(255) NULL;",
            
            # otp_verifications
            "ALTER TABLE otp_verifications MODIFY COLUMN email VARCHAR(255) NOT NULL;",
            
            # support_messages
            "ALTER TABLE support_messages MODIFY COLUMN name VARCHAR(255) NOT NULL;",
            "ALTER TABLE support_messages MODIFY COLUMN email VARCHAR(255) NOT NULL;",
            
            # support_tickets_archive (if table exists)
            "ALTER TABLE support_tickets_archive MODIFY COLUMN name VARCHAR(255) NOT NULL;",
            "ALTER TABLE support_tickets_archive MODIFY COLUMN email VARCHAR(255) NOT NULL;"
        ]
        
        for q in alter_queries:
            try:
                db.session.execute(db.text(q))
                db.session.commit()
                print(f"Executed: {q}")
            except Exception as e:
                db.session.rollback()
                print(f"Failed to execute {q}: {e}")
                
        # 2. DATA MIGRATION: Encrypt existing data in correct order
        print("\nPerforming data migration (encrypting plain-text PII)...")
        
        # Migrate users
        try:
            users = db.session.execute(db.text("SELECT id, email, full_name, phone FROM users")).fetchall()
            updated_users = 0
            for u in users:
                uid, email, full_name, phone = u
                new_email = encrypt(email)
                new_name = encrypt(full_name)
                new_phone = encrypt(phone) if phone else None
                
                if new_email != email or new_name != full_name or new_phone != phone:
                    db.session.execute(
                        db.text("UPDATE users SET email = :email, full_name = :full_name, phone = :phone WHERE id = :id"),
                        {"email": new_email, "full_name": new_name, "phone": new_phone, "id": uid}
                    )
                    updated_users += 1
            db.session.commit()
            print(f"Migrated users: {updated_users} records encrypted.")
        except Exception as e:
            db.session.rollback()
            print("Error migrating users:", e)
            
        # Migrate delivery_addresses
        try:
            addresses = db.session.execute(db.text(
                "SELECT id, house_number, building_name, street, area, landmark, city, state, pincode FROM delivery_addresses"
            )).fetchall()
            updated_addr = 0
            for addr in addresses:
                aid, h_num, b_name, street, area, l_mark, city, state, pin = addr
                new_h = encrypt(h_num) if h_num else h_num
                new_b = encrypt(b_name) if b_name else b_name
                new_str = encrypt(street) if street else street
                new_ar = encrypt(area) if area else area
                new_l = encrypt(l_mark) if l_mark else l_mark
                new_c = encrypt(city) if city else city
                new_s = encrypt(state) if state else state
                new_p = encrypt(pin) if pin else pin
                
                db.session.execute(
                    db.text("""
                        UPDATE delivery_addresses 
                        SET house_number = :h, building_name = :b, street = :str, 
                            area = :a, landmark = :l, city = :c, state = :s, pincode = :p 
                        WHERE id = :id
                    """),
                    {"h": new_h, "b": new_b, "str": new_str, "a": new_ar, "l": new_l, "c": new_c, "s": new_s, "p": new_p, "id": aid}
                )
                updated_addr += 1
            db.session.commit()
            print(f"Migrated delivery addresses: {updated_addr} records encrypted.")
        except Exception as e:
            db.session.rollback()
            print("Error migrating delivery addresses:", e)

        # Migrate otp_verifications
        try:
            otps = db.session.execute(db.text("SELECT id, email FROM otp_verifications")).fetchall()
            updated_otps = 0
            for otp in otps:
                oid, email = otp
                new_email = encrypt(email)
                if new_email != email:
                    db.session.execute(
                        db.text("UPDATE otp_verifications SET email = :email WHERE id = :id"),
                        {"email": new_email, "id": oid}
                    )
                    updated_otps += 1
            db.session.commit()
            print(f"Migrated otp_verifications: {updated_otps} records encrypted.")
        except Exception as e:
            db.session.rollback()
            print("Error migrating otp_verifications:", e)
            
        # Migrate support_messages
        try:
            msgs = db.session.execute(db.text("SELECT id, name, email FROM support_messages")).fetchall()
            updated_msgs = 0
            for m in msgs:
                mid, name, email = m
                new_name = encrypt(name)
                new_email = encrypt(email)
                if new_name != name or new_email != email:
                    db.session.execute(
                        db.text("UPDATE support_messages SET name = :name, email = :email WHERE id = :id"),
                        {"name": new_name, "email": new_email, "id": mid}
                    )
                    updated_msgs += 1
            db.session.commit()
            print(f"Migrated support_messages: {updated_msgs} records encrypted.")
        except Exception as e:
            db.session.rollback()
            print("Error migrating support_messages:", e)

        # Migrate support_tickets_archive
        try:
            msgs = db.session.execute(db.text("SELECT id, name, email FROM support_tickets_archive")).fetchall()
            updated_msgs = 0
            for m in msgs:
                mid, name, email = m
                new_name = encrypt(name)
                new_email = encrypt(email)
                if new_name != name or new_email != email:
                    db.session.execute(
                        db.text("UPDATE support_tickets_archive SET name = :name, email = :email WHERE id = :id"),
                        {"name": new_name, "email": new_email, "id": mid}
                    )
                    updated_msgs += 1
            db.session.commit()
            print(f"Migrated support_tickets_archive: {updated_msgs} records encrypted.")
        except Exception as e:
            db.session.rollback()
            print("Error migrating support_tickets_archive:", e)

        # Migrate orders (shipping_address JSON column)
        for table in ["orders", "orders_archive"]:
            try:
                orders = db.session.execute(db.text(f"SELECT id, shipping_address FROM {table}")).fetchall()
                updated_orders = 0
                for o in orders:
                    oid, sa_str = o
                    if not sa_str:
                        continue
                    try:
                        # Parsed dict/JSON
                        if isinstance(sa_str, str):
                            sa_dict = json.loads(sa_str)
                        else:
                            sa_dict = sa_str
                            
                        # If already encrypted, skip
                        if isinstance(sa_dict, dict) and "encrypted_data" in sa_dict:
                            continue
                            
                        # Serialize and encrypt
                        serialized = json.dumps(sa_dict)
                        encrypted_str = encrypt(serialized)
                        wrapped = {"encrypted_data": encrypted_str}
                        
                        db.session.execute(
                            db.text(f"UPDATE {table} SET shipping_address = :sa WHERE id = :id"),
                            {"sa": json.dumps(wrapped), "id": oid}
                        )
                        updated_orders += 1
                    except Exception as json_err:
                        print(f"JSON parsing error for order {oid} in {table}: {json_err}")
                db.session.commit()
                print(f"Migrated {table}: {updated_orders} records encrypted.")
            except Exception as e:
                db.session.rollback()
                print(f"Error migrating {table}:", e)
                
        print("\nSSJewellery Database PII Security Migration completed successfully!")

if __name__ == '__main__':
    migrate_database()
