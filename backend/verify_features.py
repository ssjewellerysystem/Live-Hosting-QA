import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:5000"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            return response.status, json.loads(res_data) if res_data else {}
    except urllib.error.HTTPError as e:
        err_data = e.read().decode("utf-8")
        print(f"HTTP Error {e.code}: {err_data}")
        return e.code, json.loads(err_data) if err_data else {}
    except Exception as e:
        print(f"Connection Error: {e}")
        return 500, {}

def run_tests():
    print("Starting automated verification tests using urllib...")
    
    # 1. Admin Login
    print("\n[Step 1] Attempting Admin login...")
    login_payload = {
        "email": "admin@SSJewellery.com",
        "password": "Admin@123"
    }
    status, res_json = make_request(f"{BASE_URL}/api/auth/login", method="POST", data=login_payload)
    if status != 200:
        print(f"FAILED to login. Status: {status}")
        sys.exit(1)
        
    token = res_json.get("access_token") or res_json.get("token")
    if not token:
        print(f"FAILED: No token received in response: {res_json}")
        sys.exit(1)
    print("SUCCESS: Logged in and retrieved admin token.")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create product payload
    product_payload = {
        "name": "Verification Diamond Ring 777",
        "category": "Rings",
        "price": 45000,
        "discount": 10,
        "stock": 5,
        "description": "Premium verification ring with exquisite diamonds.",
        "metal": "Gold",
        "purity": "22K",
        "gemstone": "Diamond",
        "show_on_homepage": False, # Default should be false
        "images": ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500"]
    }

    # 3. Create product
    print("\n[Step 3] Creating new product with show_on_homepage = False...")
    status, res_json = make_request(f"{BASE_URL}/api/products", method="POST", data=product_payload, headers=headers)
    if status not in (200, 201):
        print(f"FAILED to create product. Status: {status}, Response: {res_json}")
        sys.exit(1)
        
    product_id = res_json.get("product", {}).get("id")
    print(f"SUCCESS: Created product with ID {product_id}")

    try:
        # 4. Fetch homepage products (no category or search filters, not admin_view)
        print("\n[Step 4] Checking homepage products (should NOT contain the new product)...")
        status, homepage_products = make_request(f"{BASE_URL}/api/products")
        if status != 200:
            print(f"FAILED to fetch homepage products: {status}")
            sys.exit(1)
            
        ids_on_homepage = [p["id"] for p in homepage_products]
        if product_id in ids_on_homepage:
            print(f"FAILED: Product {product_id} is visible on homepage even though show_on_homepage=False")
            sys.exit(1)
        print("SUCCESS: Product is hidden from the homepage.")

        # 5. Fetch Rings category products (should contain the new product)
        print("\n[Step 5] Checking Rings category products (should contain the new product)...")
        status, category_products = make_request(f"{BASE_URL}/api/products?category=Rings")
        if status != 200:
            print(f"FAILED to fetch category products: {status}")
            sys.exit(1)
            
        ids_in_category = [p["id"] for p in category_products]
        if product_id not in ids_in_category:
            print(f"FAILED: Product {product_id} is NOT visible in its category 'Rings'")
            sys.exit(1)
        print("SUCCESS: Product is visible in its category page.")

        # 6. Update product to show_on_homepage = True
        print("\n[Step 6] Updating product to show_on_homepage = True...")
        update_payload = {
            "show_on_homepage": True
        }
        status, res_json = make_request(f"{BASE_URL}/api/products/{product_id}", method="PUT", data=update_payload, headers=headers)
        if status != 200:
            print(f"FAILED to update product: {status}")
            sys.exit(1)
        print("SUCCESS: Product updated.")

        # 7. Check homepage products again (should now contain the new product)
        print("\n[Step 7] Re-checking homepage products (should now contain the product)...")
        status, homepage_products2 = make_request(f"{BASE_URL}/api/products")
        if status != 200:
            print(f"FAILED to fetch homepage products: {status}")
            sys.exit(1)
            
        ids_on_homepage2 = [p["id"] for p in homepage_products2]
        if product_id not in ids_on_homepage2:
            print(f"FAILED: Product {product_id} is NOT visible on homepage after setting show_on_homepage=True")
            sys.exit(1)
        print("SUCCESS: Product is now visible on the homepage.")

    finally:
        # Cleanup: Delete the product
        print("\n[Cleanup] Deleting test product...")
        status, res_json = make_request(f"{BASE_URL}/api/products/{product_id}", method="DELETE", headers=headers)
        if status == 200:
            print("SUCCESS: Test product deleted.")
        else:
            print(f"WARNING: Failed to delete test product. Status: {status}, Response: {res_json}")

    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
