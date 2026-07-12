import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db
from backend.models.user import UserModel, DeliveryAddress
from backend.models.product import ProductModel
from backend.models.order import OrderModel, OrderItem

TEST_USER_EMAIL = "test_persist_user@SSJewellery.com"
TEST_PRODUCT_NAME = "TEST_PERSIST_PRODUCT"

def setup_persistence():
    print("=== PERSISTENCE TEST: SETUP PHASE ===")
    with app.app_context():
        # Print actual runtime database URI
        db_uri = app.config.get("SQLALCHEMY_DATABASE_URI")
        print(f"RUNTIME DATABASE URI: {db_uri}")
        
        # 1. Clean up old test data if exists
        user = UserModel.query.filter_by(email=TEST_USER_EMAIL).first()
        if user:
            print(f"Found existing test user {TEST_USER_EMAIL}. Cleaning up...")
            # Delete orders for user
            orders = OrderModel.query.filter_by(user_id=user.id).all()
            for order in orders:
                db.session.delete(order)
            db.session.delete(user)
            db.session.commit()
            
        product = ProductModel.query.filter(ProductModel.name == TEST_PRODUCT_NAME).first()
        if product:
            print(f"Found existing test product {TEST_PRODUCT_NAME}. Cleaning up...")
            db.session.delete(product)
            db.session.commit()

        # 2. Create test user
        print("Creating test user: TEST_PERSIST_USER")
        user_dict = UserModel.create_user(
            name="TEST_PERSIST_USER",
            email=TEST_USER_EMAIL,
            password="TestPassword@123",
            mobile="9999999999",
            address={
                "street": "123 Persistence Lane",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560001"
            }
        )
        user_obj = UserModel.query.filter_by(email=TEST_USER_EMAIL).first()
        assert user_obj is not None, "Failed to create test user in DB"
        print(f"Test user created successfully with ID: {user_obj.id}")

        # 3. Create test product
        print("Creating test product: TEST_PERSIST_PRODUCT")
        product_dict = ProductModel.create_product({
            "name": TEST_PRODUCT_NAME,
            "category": "Electronics",
            "price": 2099.00,
            "stock": 50,
            "description": "Product used for testing MySQL persistence.",
            "images": ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80"],
            "ratings": 4.5
        })
        product_obj = ProductModel.query.filter(ProductModel.name == TEST_PRODUCT_NAME).first()
        assert product_obj is not None, "Failed to create test product in DB"
        print(f"Test product created successfully with ID: {product_obj.id}")

        # 4. Create test order
        print("Placing test order containing the test product")
        shipping_address = {
            "name": "TEST_PERSIST_USER",
            "email": TEST_USER_EMAIL,
            "phone": "9999999999",
            "address": "123 Persistence Lane",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001"
        }
        order_items = [{
            "product_id": product_obj.id,
            "name": TEST_PRODUCT_NAME,
            "price": 2099.00,
            "quantity": 1
        }]
        
        order_dict = OrderModel.create_order(
            user_id=user_obj.id,
            shipping_address=shipping_address,
            items=order_items,
            total_amount=2099.00,
            terms_accepted=True
        )
        order_obj = OrderModel.query.filter_by(user_id=user_obj.id).first()
        assert order_obj is not None, "Failed to create test order in DB"
        print(f"Test order created successfully with Order ID: {order_obj.order_id}")
        print("Setup completed successfully. Ready for backend restart.")

def verify_persistence():
    print("=== PERSISTENCE TEST: VERIFY PHASE ===")
    with app.app_context():
        # Print actual runtime database URI
        db_uri = app.config.get("SQLALCHEMY_DATABASE_URI")
        print(f"RUNTIME DATABASE URI: {db_uri}")
        
        # 1. Verify user exists
        user_obj = UserModel.query.filter_by(email=TEST_USER_EMAIL).first()
        if user_obj:
            print(f"SUCCESS: Test user exists in MySQL (ID: {user_obj.id}, Name: {user_obj.name})")
        else:
            print("FAILURE: Test user not found in MySQL!")
            sys.exit(1)

        # 2. Verify product exists
        product_obj = ProductModel.query.filter(ProductModel.name == TEST_PRODUCT_NAME).first()
        if product_obj:
            print(f"SUCCESS: Test product exists in MySQL (ID: {product_obj.id}, Name: {product_obj.name})")
        else:
            print("FAILURE: Test product not found in MySQL!")
            sys.exit(1)

        # 3. Verify order exists
        order_obj = OrderModel.query.filter_by(user_id=user_obj.id).first()
        if order_obj:
            print(f"SUCCESS: Test order exists in MySQL (Order ID: {order_obj.order_id}, Amount: ₹{order_obj.total_amount})")
        else:
            print("FAILURE: Test order not found in MySQL!")
            sys.exit(1)

        # 4. Verify dashboard stats logic
        total_orders = OrderModel.query.count()
        total_sales = db.session.query(db.func.sum(OrderModel.total_amount)).filter(OrderModel.order_status != 'Cancelled').scalar() or 0.0
        print(f"SUCCESS: Dashboard aggregation check:")
        print(f"   - Total Orders Count in DB: {total_orders}")
        print(f"   - Total Sales (non-cancelled) in DB: ₹{total_sales}")
        print("Verification completed successfully. Database persistence confirmed!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_persistence.py [setup|verify]")
        sys.exit(1)
        
    mode = sys.argv[1].lower()
    if mode == "setup":
        setup_persistence()
    elif mode == "verify":
        verify_persistence()
    else:
        print(f"Unknown mode: {mode}")
        sys.exit(1)
