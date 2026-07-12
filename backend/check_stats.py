import os
import sys
from backend.app import app
from backend.extensions import db
from backend.models.order import OrderModel
from backend.models.product import ProductModel
from backend.models.user import UserModel
from sqlalchemy import func

with app.app_context():
    print("--- Admin Stats Diagnostic ---")
    
    # 1. Total Sales Query
    total_sales_q = db.session.query(func.sum(OrderModel.total_amount)).filter(
        OrderModel.order_status != 'Cancelled'
    ).scalar()
    print("Total Sales (sum of OrderModel.total_amount where order_status is not Cancelled):", total_sales_q)
    
    # 2. Total Sales Query using status
    total_sales_q2 = db.session.query(func.sum(OrderModel.total_amount)).filter(
        OrderModel.status != 'Cancelled'
    ).scalar()
    print("Total Sales (using OrderModel.status not Cancelled):", total_sales_q2)

    # 3. Total Orders
    total_orders = OrderModel.query.count()
    print("Total Orders:", total_orders)

    # 4. Products Count with status = 'active'
    products_active = ProductModel.query.filter(ProductModel.status == 'active').count()
    print("Active Products (status = 'active'):", products_active)
    
    # 5. Let's see some samples of ProductModel status
    all_statuses = db.session.query(ProductModel.status, func.count(ProductModel.id)).group_by(ProductModel.status).all()
    print("Product statuses count group by status:", all_statuses)
    
    # 6. Let's check some OrderModel statuses
    all_order_statuses = db.session.query(OrderModel.status, func.count(OrderModel.id)).group_by(OrderModel.status).all()
    print("Order statuses count group by status:", all_order_statuses)
    
    all_order_order_statuses = db.session.query(OrderModel.order_status, func.count(OrderModel.id)).group_by(OrderModel.order_status).all()
    print("Order statuses count group by order_status:", all_order_order_statuses)
    
    # 7. Registered Users
    total_users = UserModel.query.filter_by(is_admin=False).count()
    print("Total Registered Users (is_admin=False):", total_users)
