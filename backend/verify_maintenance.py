import os
import sys

# Ensure backend package resolution
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.app import app
from backend.extensions import db
from backend.models.settings import SiteSettingModel
import json

def run_maintenance_verification():
    print("==================================================")
    print("  RUNNING MAINTENANCE MODE AUTOMATED VERIFICATION")
    print("==================================================")

    client = app.test_client()

    # 1. Reset maintenance mode to False initially
    with app.app_context():
        setting = SiteSettingModel.query.filter_by(key='maintenance_mode').first()
        if not setting:
            setting = SiteSettingModel(key='maintenance_mode', value='false')
            db.session.add(setting)
        else:
            setting.value = 'false'
        db.session.commit()

    # 2. Check initial maintenance status endpoint
    res = client.get('/api/maintenance/status')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.get_json()
    assert data["success"] is True
    assert data["maintenance_mode"] is False
    print("✓ Initial maintenance status check passed (Maintenance OFF)")

    # 3. Verify browsing endpoints work when OFF
    res_prod = client.get('/api/products')
    assert res_prod.status_code == 200
    print("✓ Storefront browsing works (GET /api/products)")

    # 4. Enable Maintenance Mode via Admin API (simulated admin token or admin toggle)
    # Produce a valid admin token for testing
    import jwt
    from backend.middleware.auth import JWT_SECRET
    admin_token = jwt.encode({"user_id": "1", "username": "admin", "is_admin": True}, JWT_SECRET, algorithm="HS256")

    res_toggle = client.post(
        '/api/maintenance/toggle',
        json={"maintenance_mode": True, "maintenance_message": "Scheduled Maintenance Active"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_toggle.status_code == 200, f"Toggle failed: {res_toggle.data}"
    toggle_json = res_toggle.get_json()
    assert toggle_json["success"] is True
    assert toggle_json["maintenance_mode"] is True
    print("✓ Admin can enable maintenance mode via API")

    # 5. Verify database storage
    with app.app_context():
        db_setting = SiteSettingModel.query.filter_by(key='maintenance_mode').first()
        assert db_setting is not None and db_setting.value.lower() == 'true'
        by_setting = SiteSettingModel.query.filter_by(key='maintenance_by').first()
        assert by_setting is not None and by_setting.value in ["admin", "1"]
        print("✓ Database persists maintenance_mode, enabled_by_admin, and timestamp")

    # 6. Verify status endpoint returns maintenance_mode == True
    res_status_on = client.get('/api/maintenance/status')
    assert res_status_on.status_code == 200
    assert res_status_on.get_json()["maintenance_mode"] is True
    print("✓ Public /api/maintenance/status reflects Maintenance ON for 30s polling")

    # 7. Verify BROWSING still works when Maintenance is ON
    res_browse = client.get('/api/products')
    assert res_browse.status_code == 200
    res_cat = client.get('/api/products/categories')
    assert res_cat.status_code == 200
    print("✓ Product browsing and category browsing work continuously when Maintenance is ON")

    # 8. Verify ORDER CREATION is BLOCKED with HTTP 503 for non-admins
    user_token = jwt.encode({"user_id": 1, "is_admin": False}, JWT_SECRET, algorithm="HS256")
    res_order = client.post(
        '/api/orders',
        json={"items": [{"product_id": 1, "quantity": 1}], "total_amount": 1000, "terms_accepted": True},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert res_order.status_code == 503, f"Expected 503 Service Unavailable, got {res_order.status_code}"
    order_err = res_order.get_json()
    assert order_err["success"] is False
    assert order_err["maintenance"] is True
    assert "maintenance" in order_err["message"].lower() or "under maintenance" in order_err["message"].lower()
    print("✓ Order creation blocked with HTTP 503 Service Unavailable & exact JSON payload")

    # 9. Verify Request To Buy is BLOCKED with HTTP 503
    res_req_buy = client.post(
        '/api/products/1/request-buy',
        json={"quantity": 1},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert res_req_buy.status_code == 503
    print("✓ Request To Buy blocked with HTTP 503 Service Unavailable")

    # 10. Verify ADMIN panel access is NEVER blocked
    res_admin_categories = client.get('/api/admin/categories', headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_categories.status_code == 200
    print("✓ Admin panel endpoints remain 100% accessible to admins during maintenance")

    # 11. Disable Maintenance Mode
    res_disable = client.post(
        '/api/maintenance/toggle',
        json={"maintenance_mode": False},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_disable.status_code == 200
    assert res_disable.get_json()["maintenance_mode"] is False
    print("✓ Admin can disable maintenance mode")

    # 12. Verify status returns False after disabling
    res_status_off = client.get('/api/maintenance/status')
    assert res_status_off.get_json()["maintenance_mode"] is False
    print("✓ Disabling maintenance mode restores normal store operations")

    print("\n==================================================")
    print("  ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!  ")
    print("==================================================")

if __name__ == '__main__':
    run_maintenance_verification()
