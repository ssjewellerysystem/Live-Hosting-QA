import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.models.product import ProductModel
from backend.models.user import UserModel
from backend.models.order import OrderModel
from backend.models.support import SupportModel

def verify_all():
    print("=" * 60)
    print("SSJewellery Performance & Pagination Verification Test")
    print("=" * 60)

    with app.app_context():
        # 1. Product Pagination Test
        print("\n1. Testing Product Model Pagination...")
        paginated_products = ProductModel.get_all(page=1, limit=5)
        print("  Keys returned:", list(paginated_products.keys()))
        print("  Current Page:", paginated_products.get("current_page"))
        print("  Page Size:", paginated_products.get("page_size"))
        print("  Total Records:", paginated_products.get("total_records"))
        print("  Total Pages:", paginated_products.get("total_pages"))
        print("  Items Length:", len(paginated_products.get("items", [])))
        assert "items" in paginated_products
        assert "total_records" in paginated_products

        # 2. User Pagination Test
        print("\n2. Testing User Model Pagination...")
        paginated_users = UserModel.find_all(page=1, limit=5)
        print("  Current Page:", paginated_users.get("current_page"))
        print("  Total Records:", paginated_users.get("total_records"))

        # 3. Order Pagination Test
        print("\n3. Testing Order Model Pagination...")
        paginated_orders = OrderModel.find_all(page=1, limit=5)
        print("  Current Page:", paginated_orders.get("current_page"))
        print("  Total Records:", paginated_orders.get("total_records"))

        # 4. Support Tickets Pagination Test
        print("\n4. Testing Support Model Pagination...")
        paginated_support = SupportModel.find_all(page=1, limit=5)
        print("  Current Page:", paginated_support.get("current_page"))
        print("  Total Records:", paginated_support.get("total_records"))

    print("\n✓ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_all()
