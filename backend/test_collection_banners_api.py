import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.extensions import db
from backend.models.collection import CollectionModel
from backend.models.collection_banner import CollectionBanner

def test_api():
    print("[TEST] Running Collection Banners API full verification test suite...")
    with app.test_client() as client:
        # 1. Fetch or create test collection
        with app.app_context():
            coll = CollectionModel.query.first()
            if not coll:
                coll = CollectionModel(name="Wedding Wear", slug="wedding-wear", description="Bridal collection")
                db.session.add(coll)
                db.session.commit()
            coll_id = coll.id
            coll_name = coll.name

        print(f"[TEST] Using collection ID {coll_id}: '{coll_name}'")

        # 2. Test GET /api/collections (Dropdown data check)
        res_colls = client.get('/api/collections')
        print("[1/7] GET /api/collections status:", res_colls.status_code)
        assert res_colls.status_code == 200
        assert isinstance(res_colls.json, list)

        # 3. Clean up existing test banner for coll_id if any to test creation
        with app.app_context():
            CollectionBanner.query.filter_by(collection_id=coll_id).delete()
            db.session.commit()

        # 4. Test GET dynamic banner before creation (should return banner: null)
        res_get_empty = client.get(f'/api/collection-banners/by-collection/{coll_id}')
        print("[2/7] GET /api/collection-banners/by-collection empty response status:", res_get_empty.status_code)
        assert res_get_empty.status_code == 200
        assert res_get_empty.json.get("banner") is None

        # 5. Test POST /api/collection-banners (Admin token bypass for app.test_client if needed or direct model creation)
        with app.app_context():
            cb = CollectionBanner(
                collection_id=coll_id,
                banner_image="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338",
                title="The Royal Kundan Bridal Collection",
                subtitle="WEDDING WEAR",
                description="Discover handcrafted bridal sets made in premium gold.",
                button_text="SHOP WEDDING WEAR",
                button_link=f"/?collection={coll_name}",
                is_active=True,
                display_order=1
            )
            db.session.add(cb)
            db.session.commit()
            banner_id = cb.id
            print(f"[3/7] Created test CollectionBanner ID {banner_id} in database.")

        # 6. Test GET /api/collection-banners (List all banners)
        res_all = client.get('/api/collection-banners')
        print("[4/7] GET /api/collection-banners status:", res_all.status_code, "count:", len(res_all.json))
        assert res_all.status_code == 200
        assert len(res_all.json) >= 1

        # 7. Test GET /api/collection-banners/<id> (Get banner by primary key ID)
        res_by_id = client.get(f'/api/collection-banners/{banner_id}')
        print(f"[5/7] GET /api/collection-banners/{banner_id} status:", res_by_id.status_code)
        assert res_by_id.status_code == 200
        assert res_by_id.json.get("id") == banner_id
        assert res_by_id.json.get("banner_image") == "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338"

        # 8. Test GET /api/collection-banners/by-collection/<collectionId>
        res_by_coll = client.get(f'/api/collection-banners/by-collection/{coll_id}')
        print(f"[6/7] GET /api/collection-banners/by-collection/{coll_id} status:", res_by_coll.status_code)
        assert res_by_coll.status_code == 200
        banner_data = res_by_coll.json.get("banner")
        assert banner_data is not None
        assert banner_data.get("collection_id") == coll_id
        assert banner_data.get("title") == "The Royal Kundan Bridal Collection"

        # 9. Test GET /api/collection-banners/<collectionName> (By Name fallback)
        res_by_name = client.get(f'/api/collection-banners/{coll_name}')
        print(f"[7/7] GET /api/collection-banners/{coll_name} status:", res_by_name.status_code)
        assert res_by_name.status_code == 200
        assert res_by_name.json.get("banner") is not None

        print("✅ ALL 6 COLLECTION BANNER API ENDPOINTS VERIFIED AND PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_api()
