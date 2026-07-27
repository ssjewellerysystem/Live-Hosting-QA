import os
import sys

# Set up project path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db

INDEXES = [
    # Existing basic indexes (ensured)
    ("idx_delivery_addresses_user_id", "delivery_addresses", "(user_id)"),
    ("idx_cart_items_cart_id", "cart_items", "(cart_id)"),
    ("idx_cart_items_product_id", "cart_items", "(product_id)"),
    ("idx_wishlists_user_id", "wishlists", "(user_id)"),
    ("idx_wishlists_product_id", "wishlists", "(product_id)"),
    ("idx_products_category_id", "products", "(category_id)"),
    ("idx_products_status", "products", "(status)"),
    ("idx_products_show_on_homepage", "products", "(show_on_homepage)"),
    ("idx_product_images_product_id", "product_images", "(product_id)"),
    ("idx_reviews_product_id", "reviews", "(product_id)"),
    ("idx_reviews_user_id", "reviews", "(user_id)"),
    ("idx_orders_user_id", "orders", "(user_id)"),
    ("idx_order_items_order_id", "order_items", "(order_id)"),
    ("idx_order_items_product_id", "order_items", "(product_id)"),
    ("idx_transactions_order_id", "transactions", "(order_id)"),
    
    # New high-performance composite indexes
    ("idx_products_status_homepage", "products", "(status, show_on_homepage)"),
    ("idx_products_cat_status", "products", "(category_id, status)"),
    ("idx_products_coll_status", "products", "(collection_id, status)"),
    ("idx_products_created_at", "products", "(created_at DESC)"),
    ("idx_orders_user_created", "orders", "(user_id, created_at DESC)"),
    ("idx_orders_status_created", "orders", "(order_status, created_at DESC)"),
    ("idx_cart_items_cart_prod", "cart_items", "(cart_id, product_id)"),
    ("idx_wishlists_user_prod", "wishlists", "(user_id, product_id)"),
    ("idx_support_email_created", "support_messages", "(email, created_at DESC)"),
    ("idx_admin_audit_logs_created", "admin_audit_logs", "(created_at DESC)"),
]

def apply_database_optimizations():
    print("=" * 60)
    print("Starting SSJewellery Enterprise PostgreSQL Database Optimization")
    print("=" * 60)
    
    with app.app_context():
        # 1. Enable pg_trgm extension if available
        try:
            db.session.execute(db.text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
            db.session.commit()
            print("✓ PostgreSQL pg_trgm extension enabled successfully.")
        except Exception as e:
            db.session.rollback()
            print(f"! Notice: Could not enable pg_trgm extension: {e}")

        # 2. Create B-Tree Indexes
        for index_name, table, columns in INDEXES:
            try:
                check_query = f"SELECT 1 FROM pg_indexes WHERE indexname = '{index_name}'"
                exists = db.session.execute(db.text(check_query)).scalar()
                if exists:
                    print(f"- Index '{index_name}' already exists on '{table}'. Skipping.")
                    continue
                
                create_query = f"CREATE INDEX IF NOT EXISTS {index_name} ON {table} {columns}"
                print(f"Creating index: {create_query}")
                db.session.execute(db.text(create_query))
                db.session.commit()
                print(f"✓ Successfully created index '{index_name}'.")
            except Exception as e:
                db.session.rollback()
                print(f"! Error creating index '{index_name}' on '{table}': {e}")

        # 3. Create Trigram GIN Search Indexes if pg_trgm is available
        trgm_indexes = [
            ("idx_products_name_trgm", "products", "USING gin (name gin_trgm_ops)"),
            ("idx_products_desc_trgm", "products", "USING gin (description gin_trgm_ops)")
        ]
        for index_name, table, definition in trgm_indexes:
            try:
                check_query = f"SELECT 1 FROM pg_indexes WHERE indexname = '{index_name}'"
                exists = db.session.execute(db.text(check_query)).scalar()
                if exists:
                    print(f"- GIN Index '{index_name}' already exists on '{table}'. Skipping.")
                    continue

                create_query = f"CREATE INDEX IF NOT EXISTS {index_name} ON {table} {definition}"
                print(f"Creating GIN Trigram index: {create_query}")
                db.session.execute(db.text(create_query))
                db.session.commit()
                print(f"✓ Successfully created GIN index '{index_name}'.")
            except Exception as e:
                db.session.rollback()
                print(f"! Notice on GIN Index '{index_name}': {e}")

        # 4. Phase 10: Database Maintenance - VACUUM ANALYZE
        try:
            print("\nExecuting ANALYZE to update table statistics for query planner...")
            db.session.execute(db.text("ANALYZE;"))
            db.session.commit()
            print("✓ ANALYZE completed successfully.")
        except Exception as e:
            db.session.rollback()
            print(f"! Error during ANALYZE: {e}")

        # 5. Query Plan Verification
        try:
            print("\nVerifying Query Plan for Product Listing Query...")
            explain = db.session.execute(db.text("EXPLAIN SELECT id, name, price FROM products WHERE status = 'active' ORDER BY created_at DESC LIMIT 20;")).fetchall()
            for line in explain:
                print("  [EXPLAIN]", line[0])
        except Exception as e:
            print(f"! Error getting query plan: {e}")

    print("\nDatabase Optimization Finished Successfully!")

if __name__ == "__main__":
    apply_database_optimizations()
