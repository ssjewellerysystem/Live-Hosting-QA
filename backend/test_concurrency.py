import sys
import os
import threading
import json
import time
import urllib.request
import urllib.error

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db
from backend.models.user import UserModel
from backend.models.product import ProductModel
from backend.models.order import OrderModel

BACKEND_URL = "http://localhost:5000"
TEST_USER_EMAIL = "test_persist_user@SSJewellery.com"
TEST_USER_PASSWORD = "TestPassword@123"
TEST_PRODUCT_NAME = "TEST_PERSIST_PRODUCT"

def http_post(url, payload, headers=None):
    headers = headers or {}
    if "Content-Type" not in headers:
        headers["Content-Type"] = "application/json"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            body = json.loads(response.read().decode("utf-8"))
            return status, body
    except urllib.error.HTTPError as err:
        try:
            body = json.loads(err.read().decode("utf-8"))
        except Exception:
            body = {"message": err.reason}
        return err.code, body
    except Exception as err:
        return 0, {"message": str(err)}

def run_stress_test():
    print("=== STARTING CONCURRENCY STRESS TEST ===")
    
    # 1. Setup/Verify user and product in app context
    with app.app_context():
        user = UserModel.query.filter_by(email=TEST_USER_EMAIL).first()
        if not user:
            print("Test user not found. Please run: python backend/test_persistence.py setup")
            sys.exit(1)
            
        # Ensure test user is active and email is verified
        user.email_verified = True
        user.is_blocked = False
        
        product = ProductModel.query.filter(ProductModel.name == TEST_PRODUCT_NAME).first()
        if not product:
            print("Test product not found. Please run: python backend/test_persistence.py setup")
            sys.exit(1)
            
        # Reset product stock to exactly 5
        product.stock = 5
        db.session.commit()
        product_id = product.id
        print(f"Product '{TEST_PRODUCT_NAME}' (ID: {product_id}) stock reset to 5.")
        print(f"User email verification status set to True.")

    # 2. Authenticate to get JWT token
    print("Logging in to obtain JWT authentication token...")
    status, body = http_post(
        f"{BACKEND_URL}/api/auth/login",
        {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
    )
    if status != 200:
        print(f"Login failed status={status}: {body}")
        sys.exit(1)
        
    token = body.get("token")
    print("Login successful! Token obtained.")

    # 3. Define headers and payload
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    payload = {
        "shipping_address": {
            "name": "TEST_PERSIST_USER",
            "email": TEST_USER_EMAIL,
            "phone": "9999999999",
            "address": "123 Persistence Lane",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001"
        },
        "items": [{
            "product_id": product_id,
            "name": TEST_PRODUCT_NAME,
            "price": 2099.00,
            "quantity": 1
        }],
        "total_amount": 2099.00,
        "terms_accepted": True
    }

    # 4. Spin up concurrent threads to checkout
    results = []
    threads = []
    barrier = threading.Barrier(10) # Synchronize start of all 10 threads

    def checkout_worker():
        barrier.wait() # Ensure all threads fire at the exact same instant
        status, body = http_post(
            f"{BACKEND_URL}/api/orders",
            payload,
            headers
        )
        results.append((status, body))

    print("Spawning 10 concurrent checkout threads...")
    for _ in range(10):
        t = threading.Thread(target=checkout_worker)
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    # 5. Analyze results
    success_count = 0
    failure_count = 0
    other_count = 0
    
    print("\n--- Thread Responses ---")
    for status, body in results:
        print(f"Status: {status} | Message: {body.get('message')}")
        if status == 201:
            success_count += 1
        elif status == 400:
            failure_count += 1
        else:
            other_count += 1

    print("\n--- Summary ---")
    print(f"Total Requests: 10")
    print(f"Successes (201): {success_count} (Expected: 5)")
    print(f"Failures (400): {failure_count} (Expected: 5)")
    print(f"Other statuses: {other_count} (Expected: 0)")

    # 6. Verify final stock levels in app context
    with app.app_context():
        db.session.expire_all()
        product = ProductModel.query.get(product_id)
        final_stock = product.stock
        print(f"\nFinal Stock in DB: {final_stock} (Expected: 0)")

    # Final assertions
    if success_count == 5 and failure_count == 5 and final_stock == 0:
        print("\n[SUCCESS] Concurrency test passed flawlessly! No overselling occurred, and exact stock reduction was enforced.")
    else:
        print("\n[FAILURE] Concurrency test failed. Check logs and transaction locks.")
        sys.exit(1)

if __name__ == "__main__":
    run_stress_test()
