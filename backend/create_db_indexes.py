import os
import sys

# Set up project path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db

INDEXES = [
    # Table: delivery_addresses
    ("idx_delivery_addresses_user_id", "delivery_addresses", "user_id"),
    
    # Table: cart_items
    ("idx_cart_items_cart_id", "cart_items", "cart_id"),
    ("idx_cart_items_product_id", "cart_items", "product_id"),
    
    # Table: wishlists
    ("idx_wishlists_user_id", "wishlists", "user_id"),
    ("idx_wishlists_product_id", "wishlists", "product_id"),
    
    # Table: products
    ("idx_products_category_id", "products", "category_id"),
    ("idx_products_status", "products", "status"),
    ("idx_products_show_on_homepage", "products", "show_on_homepage"),
    
    # Table: product_images
    ("idx_product_images_product_id", "product_images", "product_id"),
    
    # Table: reviews
    ("idx_reviews_product_id", "reviews", "product_id"),
    ("idx_reviews_user_id", "reviews", "user_id"),
    
    # Table: orders
    ("idx_orders_user_id", "orders", "user_id"),
    
    # Table: order_items
    ("idx_order_items_order_id", "order_items", "order_id"),
    ("idx_order_items_product_id", "order_items", "product_id"),
    
    # Table: transactions
    ("idx_transactions_order_id", "transactions", "order_id")
]

def apply_indexes():
    print("Connecting to Neon PostgreSQL and applying indexes...")
    with app.app_context():
        for index_name, table, column in INDEXES:
            try:
                # Check if index already exists in PostgreSQL
                check_query = f"""
                    SELECT 1 FROM pg_indexes 
                    WHERE indexname = '{index_name}'
                """
                exists = db.session.execute(db.text(check_query)).scalar()
                if exists:
                    print(f"Index '{index_name}' already exists on '{table}({column})'. Skipping.")
                    continue
                
                # Create the index
                create_query = f"CREATE INDEX {index_name} ON {table}({column})"
                print(f"Creating index: {create_query}")
                db.session.execute(db.text(create_query))
                db.session.commit()
                print(f"Successfully created index '{index_name}'.")
            except Exception as e:
                db.session.rollback()
                print(f"Error creating index '{index_name}' on '{table}({column})': {e}")
                
if __name__ == "__main__":
    apply_indexes()
