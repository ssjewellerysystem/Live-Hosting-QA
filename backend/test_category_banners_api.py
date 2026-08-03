import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db
from backend.models.category import Category
from backend.models.category_banner import CategoryBanner

def test_api():
    print("[TEST] Running Category Banners API verification test...")
    with app.test_client() as client:
        # 1. Fetch categories
        with app.app_context():
            cat = Category.query.first()
            if not cat:
                cat = Category(name="Rings", name_en="Rings", name_hi="अंगूठियाँ")
                db.session.add(cat)
                db.session.commit()
            cat_id = cat.id
            cat_name = cat.name

        print(f"[TEST] Using category ID {cat_id}: '{cat_name}'")

        # 2. Test GET dynamic banner before creation (should return banner: null)
        res_get_empty = client.get(f'/api/category-banners/category/{cat_name}')
        print("GET empty banner response status:", res_get_empty.status_code, res_get_empty.json)

        # 3. Create test CategoryBanner directly in DB for testing GET
        with app.app_context():
            existing = CategoryBanner.query.filter_by(category_id=cat_id).first()
            if not existing:
                cb = CategoryBanner(
                    category_id=cat_id,
                    banner_image="/luxury_solitaire_ring.png",
                    title="The Solitaire Diamond Collection",
                    subtitle="RINGS",
                    description="Discover handcrafted solitaire rings made in premium gold.",
                    button_text="SHOP SOLITAIRES",
                    button_link="/products",
                    is_active=True,
                    display_order=1
                )
                db.session.add(cb)
                db.session.commit()
                print("[TEST] Inserted test CategoryBanner in DB.")

        # 4. Test GET dynamic banner after creation
        res_get = client.get(f'/api/category-banners/category/{cat_name}')
        print("GET category banner status:", res_get.status_code)
        banner_data = res_get.json.get("banner")
        print("GET banner data:", banner_data)

        assert res_get.status_code == 200
        assert banner_data is not None
        assert banner_data.get("category_id") == cat_id
        assert banner_data.get("banner_image") == "/luxury_solitaire_ring.png"
        assert banner_data.get("title") == "The Solitaire Diamond Collection"
        assert banner_data.get("status") == "Active"

        # 5. Test GET all banners
        res_all = client.get('/api/category-banners')
        print("GET all category banners count:", len(res_all.json))
        assert res_all.status_code == 200
        assert len(res_all.json) >= 1

        print("✅ ALL BACKEND CATEGORY BANNER API TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_api()
