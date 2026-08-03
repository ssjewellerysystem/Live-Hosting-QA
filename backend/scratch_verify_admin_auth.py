import sys
import os
import jwt
from datetime import datetime, timedelta

# Append project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.app import app
from backend.config import Config
from backend.middleware.auth import is_admin_role, extract_bearer_token, admin_required

print("--- Testing Authorization Helper Functions ---")

# 1. Test is_admin_role
payloads = [
    {"is_admin": True, "role": "admin"},
    {"is_admin": "true", "role": "admin"},
    {"is_admin": 1, "role": "admin"},
    {"is_admin": False, "role": "superadmin"},
    {"is_admin": False, "role": "Super Admin"},
    {"is_admin": False, "role": "customer"}
]

for p in payloads:
    res = is_admin_role(p)
    print(f"Payload {p} -> is_admin_role: {res}")
    assert res == (p["role"] != "customer"), f"Failed for {p}"

# 2. Test extract_bearer_token
print("\n--- Testing Bearer Token Extraction ---")
with app.test_request_context(headers={"Authorization": "Bearer valid_jwt_token_123"}):
    tok = extract_bearer_token()
    print(f"Header 'Bearer valid_jwt_token_123' -> extracted: '{tok}'")
    assert tok == "valid_jwt_token_123"

with app.test_request_context(headers={"Authorization": "Bearer null"}):
    tok = extract_bearer_token()
    print(f"Header 'Bearer null' -> extracted: '{tok}'")
    assert tok is None

with app.test_request_context(headers={"Authorization": "Bearer undefined"}):
    tok = extract_bearer_token()
    print(f"Header 'Bearer undefined' -> extracted: '{tok}'")
    assert tok is None

# 3. Test Flask Test Client Admin Route Authorization
print("\n--- Testing Route Authorization via App Test Client ---")
client = app.test_client()

# Generate valid admin JWT token
JWT_SECRET = Config.JWT_SECRET
admin_payload = {
    "admin_id": "1",
    "user_id": "1",
    "username": "admin",
    "is_admin": True,
    "role": "admin",
    "exp": datetime.utcnow() + timedelta(hours=1)
}
token = jwt.encode(admin_payload, JWT_SECRET, algorithm="HS256")

# Test OPTIONS /api/admin/users-complete
resp_opt = client.options('/api/admin/users-complete')
print(f"OPTIONS /api/admin/users-complete -> Status: {resp_opt.status_code}")
assert resp_opt.status_code == 200

# Test GET /api/admin/users-complete with Bearer Token
resp_get = client.get('/api/admin/users-complete', headers={"Authorization": f"Bearer {token}"})
print(f"GET /api/admin/users-complete -> Status: {resp_get.status_code}")
assert resp_get.status_code == 200

# Test GET with invalid token
resp_bad = client.get('/api/admin/users-complete', headers={"Authorization": "Bearer invalid_token"})
print(f"GET /api/admin/users-complete (invalid token) -> Status: {resp_bad.status_code}, Msg: {resp_bad.get_json()}")
assert resp_bad.status_code == 401

print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
