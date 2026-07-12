import os
import sys
from backend.app import app
from backend.extensions import db
from backend.models.user import UserModel, DeliveryAddress
from backend.models.order import OrderModel
from backend.models.product import BuyRequestModel
from backend.models.support import SupportModel

with app.app_context():
    print("--- Encryption Diagnostic ---")
    
    # 1. Check Users
    users = UserModel.query.all()
    print(f"Total Users: {len(users)}")
    for u in users[:5]:
        print(f"User ID: {u.id}")
        print(f"  Name: {u.full_name}")
        print(f"  Email: {u.email}")
        print(f"  Phone: {u.phone}")
        print(f"  Address count: {len(u.addresses)}")
        for addr in u.addresses:
            print(f"    Addr ID: {addr.id}, default: {addr.is_default}")
            print(f"      Street: {addr.street}")
            print(f"      City: {addr.city}")
            print(f"      Pincode: {addr.pincode}")

    # 2. Check Buy Requests
    buy_reqs = BuyRequestModel.query.all()
    print(f"\nTotal Buy Requests: {len(buy_reqs)}")
    for r in buy_reqs[:5]:
        print(f"Req ID: {r.id}")
        print(f"  Product: {r.product_name}")
        print(f"  User Name: {r.user.full_name if r.user else 'None'}")
        print(f"  User Email: {r.user.email if r.user else 'None'}")
        print(f"  Address ID: {r.selected_address_id}")
        d = r.to_dict()
        print(f"  to_dict email: {d.get('email')}")
        print(f"  to_dict mobile: {d.get('mobile')}")
        print(f"  to_dict address: {d.get('address')}")

    # 3. Check Support Messages
    msgs = SupportModel.query.all()
    print(f"\nTotal Support Messages: {len(msgs)}")
    for m in msgs[:5]:
        print(f"Msg ID: {m.id}")
        print(f"  Name: {m.name}")
        print(f"  Email: {m.email}")
        print(f"  Message: {m.message[:30]}...")

    # 4. Check Orders
    orders = OrderModel.query.all()
    print(f"\nTotal Orders: {len(orders)}")
    for o in orders[:5]:
        print(f"Order ID: {o.id}, Order Code: {o.order_id}")
        print(f"  Shipping Address: {o.shipping_address}")
        d = o.to_dict()
        print(f"  to_dict Shipping Address: {d.get('shipping_address')}")
