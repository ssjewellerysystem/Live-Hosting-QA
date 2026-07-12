import os
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend to avoid UI thread issues
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime, timedelta
import pytz
from backend.extensions import db
from backend.models.order import OrderModel, OrderItem
from backend.models.product import ProductModel

CHARTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'uploads', 'charts')
os.makedirs(CHARTS_DIR, exist_ok=True)

import time
from functools import wraps

def cache_chart_file(timeout=600):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            func_name = f.__name__
            if func_name == "generate_top_selling_chart":
                filename = "top_selling_products.png"
            elif func_name == "generate_low_stock_chart":
                filename = "low_stock_inventory.png"
            elif func_name == "generate_revenue_trend_chart":
                filename = "revenue_trend.png"
            elif func_name == "generate_sales_chart":
                filename = "sales_volume_trend.png"
            elif func_name == "generate_orders_chart":
                filename = "orders_volume_trend.png"
            elif func_name == "generate_product_sales_chart":
                filename = f"product_{args[0]}_sales.png"
            elif func_name == "generate_product_revenue_chart":
                filename = f"product_{args[0]}_revenue.png"
            elif func_name == "generate_product_orders_chart":
                filename = f"product_{args[0]}_orders.png"
            elif func_name == "generate_product_stock_chart":
                filename = f"product_{args[0]}_stock.png"
            else:
                return f(*args, **kwargs)
            
            filepath = os.path.join(CHARTS_DIR, filename)
            if os.path.exists(filepath):
                try:
                    mtime = os.path.getmtime(filepath)
                    if time.time() - mtime < timeout:
                        return f"/static/uploads/charts/{filename}"
                except Exception:
                    pass
            
            return f(*args, **kwargs)
        return wrapper
    return decorator


# Styling Helper
def apply_premium_style():
    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['font.size'] = 10
    plt.rcParams['axes.edgecolor'] = '#e2e8f0'
    plt.rcParams['axes.linewidth'] = 0.8
    plt.rcParams['grid.color'] = '#f1f5f9'
    plt.rcParams['grid.linestyle'] = '-'
    plt.rcParams['grid.linewidth'] = 0.5

@cache_chart_file()
def generate_product_sales_chart(product_id):
    apply_premium_style()
    prod_id = int(product_id)
    product = ProductModel.query.get(prod_id)
    if not product:
        return None

    # Query all order items for this product
    items = db.session.query(
        OrderItem.quantity,
        OrderItem.price,
        OrderModel.created_at
    ).join(OrderModel, OrderModel.id == OrderItem.order_id).filter(
        OrderItem.product_id == prod_id,
        OrderModel.order_status != "Cancelled"
    ).all()

    filename = f"product_{prod_id}_sales.png"
    filepath = os.path.join(CHARTS_DIR, filename)

    if not items:
        # Create empty placeholder chart
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.text(0.5, 0.5, 'No Sales Data Available for this Product', 
                horizontalalignment='center', verticalalignment='center',
                fontsize=14, color='#64748b', weight='bold')
        ax.set_axis_off()
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight')
        plt.close()
        return f"/static/uploads/charts/{filename}"

    # Load into Pandas
    df = pd.DataFrame(items, columns=['quantity', 'price', 'created_at'])
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['date'] = df['created_at'].dt.date
    df['revenue'] = df['quantity'] * df['price'].astype(float)

    # Aggregate
    daily_sales = df.groupby('date')['quantity'].sum().reset_index()

    fig, ax = plt.subplots(figsize=(8, 4))
    
    # Plotting daily sales
    ax.plot(daily_sales['date'], daily_sales['quantity'], marker='o', color='#3b82f6', 
            linewidth=2, label='Daily Sales (Units)')
    
    ax.set_title(f"Sales Trend: {product.name}", fontsize=12, fontweight='bold', pad=15, color='#1e293b')
    ax.set_xlabel("Date", fontsize=10, color='#475569')
    ax.set_ylabel("Units Sold", fontsize=10, color='#475569')
    
    # Rotate date labels
    plt.xticks(rotation=30, ha='right')
    
    # Set limit
    ax.set_ylim(bottom=0)
    
    # Smooth layout
    plt.tight_layout()
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return f"/static/uploads/charts/{filename}"

@cache_chart_file()
def generate_top_selling_chart():
    apply_premium_style()
    # Query sales count per product
    items = db.session.query(
        OrderItem.product_id,
        OrderItem.name,
        db.func.sum(OrderItem.quantity).label('total_sold')
    ).join(OrderModel, OrderModel.id == OrderItem.order_id).filter(
        OrderModel.order_status != "Cancelled"
    ).group_by(OrderItem.product_id, OrderItem.name).order_by(db.desc('total_sold')).limit(10).all()

    filename = "top_selling_products.png"
    filepath = os.path.join(CHARTS_DIR, filename)

    if not items:
        # Create empty placeholder chart
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.text(0.5, 0.5, 'No Sales Data Recorded', 
                horizontalalignment='center', verticalalignment='center',
                fontsize=14, color='#64748b', weight='bold')
        ax.set_axis_off()
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight')
        plt.close()
        return f"/static/uploads/charts/{filename}"

    # Pandas processing
    df = pd.DataFrame(items, columns=['product_id', 'name', 'total_sold'])
    df = df.sort_values(by='total_sold', ascending=True) # Ascending for horizontal bar

    fig, ax = plt.subplots(figsize=(8, 4.5))
    
    # Colors gradient
    colors = plt.cm.Blues(pd.qcut(df['total_sold'], q=len(df), labels=False, duplicates='drop') / len(df) * 0.6 + 0.4)
    
    bars = ax.barh(df['name'], df['total_sold'], color='#10b981', height=0.6)
    
    # Add values on bar ends
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 0.2, bar.get_y() + bar.get_height()/2, f'{int(width)}', 
                va='center', ha='left', fontsize=9, fontweight='semibold', color='#334155')

    ax.set_title("Top 10 Selling Products by Volume", fontsize=12, fontweight='bold', pad=15, color='#1e293b')
    ax.set_xlabel("Units Sold", fontsize=10, color='#475569')
    
    # Grid
    ax.xaxis.grid(True, linestyle='--', alpha=0.6, color='#cbd5e1')
    ax.yaxis.grid(False)
    
    # Adjust padding
    plt.tight_layout()
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return f"/static/uploads/charts/{filename}"

@cache_chart_file()
def generate_low_stock_chart():
    apply_premium_style()
    # Query products with stock below 10
    products = ProductModel.query.filter(ProductModel.stock < 10).order_by(ProductModel.stock.asc()).limit(15).all()

    filename = "low_stock_inventory.png"
    filepath = os.path.join(CHARTS_DIR, filename)

    if not products:
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.text(0.5, 0.5, 'All Products are well stocked! (No items < 10 units)', 
                horizontalalignment='center', verticalalignment='center',
                fontsize=14, color='#10b981', weight='bold')
        ax.set_axis_off()
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight')
        plt.close()
        return f"/static/uploads/charts/{filename}"

    df = pd.DataFrame([{
        "name": p.name[:25] + "..." if len(p.name) > 25 else p.name,
        "stock": p.stock
    } for p in products])

    fig, ax = plt.subplots(figsize=(8, 4.5))
    
    # Highlight extremely low stock (below 3) in crimson, others in dark orange
    colors = ['#ef4444' if s < 3 else '#f97316' for s in df['stock']]
    
    bars = ax.bar(df['name'], df['stock'], color=colors, width=0.5)
    
    # Add values above bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 0.2, f'{int(height)}',
                ha='center', va='bottom', fontsize=9, fontweight='semibold', color='#ef4444')

    ax.set_title("Products with Low Inventory (Stock < 10)", fontsize=12, fontweight='bold', pad=15, color='#1e293b')
    ax.set_ylabel("Current Stock (Units)", fontsize=10, color='#475569')
    plt.xticks(rotation=45, ha='right')
    
    ax.set_ylim(0, 12)
    ax.yaxis.grid(True, linestyle='--', alpha=0.6, color='#cbd5e1')
    ax.xaxis.grid(False)

    plt.tight_layout()
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return f"/static/uploads/charts/{filename}"

@cache_chart_file()
def generate_revenue_trend_chart():
    apply_premium_style()
    # Query all orders (excluding cancelled)
    orders = db.session.query(
        OrderModel.total_amount,
        OrderModel.created_at
    ).filter(OrderModel.order_status != "Cancelled").all()

    filename = "revenue_trend.png"
    filepath = os.path.join(CHARTS_DIR, filename)

    if not orders:
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.text(0.5, 0.5, 'No Revenue Recorded Yet', 
                horizontalalignment='center', verticalalignment='center',
                fontsize=14, color='#64748b', weight='bold')
        ax.set_axis_off()
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight')
        plt.close()
        return f"/static/uploads/charts/{filename}"

    df = pd.DataFrame(orders, columns=['total_amount', 'created_at'])
    df['total_amount'] = df['total_amount'].astype(float)
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['date'] = df['created_at'].dt.date

    # Last 30 days range
    end_date = datetime.now(pytz.timezone('Asia/Kolkata')).date()
    start_date = end_date - timedelta(days=29)
    all_dates = pd.date_range(start=start_date, end=end_date).date

    # Daily aggregation
    daily_rev = df.groupby('date')['total_amount'].sum().reindex(all_dates, fill_value=0.0).reset_index()
    daily_rev.columns = ['date', 'revenue']

    fig, ax = plt.subplots(figsize=(8, 4))
    
    # Area chart for revenue trend
    ax.plot(daily_rev['date'], daily_rev['revenue'], color='#6366f1', linewidth=2, marker='o', markersize=4)
    ax.fill_between(daily_rev['date'], daily_rev['revenue'], color='#6366f1', alpha=0.1)

    ax.set_title("30-Day Revenue Trend (₹)", fontsize=12, fontweight='bold', pad=15, color='#1e293b')
    ax.set_ylabel("Revenue (₹)", fontsize=10, color='#475569')
    plt.xticks(rotation=30, ha='right')
    
    ax.set_ylim(bottom=0)
    ax.yaxis.grid(True, linestyle='--', alpha=0.6, color='#cbd5e1')
    ax.xaxis.grid(False)

    plt.tight_layout()
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return f"/static/uploads/charts/{filename}"

def get_revenue_summary_stats():
    # Query all orders (excluding cancelled)
    orders = db.session.query(
        OrderModel.total_amount,
        OrderModel.created_at
    ).filter(OrderModel.order_status != "Cancelled").all()

    if not orders:
        return {
            "today_revenue": 0.0,
            "weekly_revenue": 0.0,
            "monthly_revenue": 0.0,
            "total_revenue": 0.0
        }

    df = pd.DataFrame(orders, columns=['total_amount', 'created_at'])
    df['total_amount'] = df['total_amount'].astype(float)
    df['created_at'] = pd.to_datetime(df['created_at'])
    
    # Filter bounds
    now = datetime.now(pytz.timezone('Asia/Kolkata'))
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)

    # Localize standard timezone if needed
    if df['created_at'].dt.tz is None:
        df['created_at'] = df['created_at'].dt.tz_localize('Asia/Kolkata')

    today_rev = df[df['created_at'] >= today_start]['total_amount'].sum()
    week_rev = df[df['created_at'] >= week_start]['total_amount'].sum()
    month_rev = df[df['created_at'] >= month_start]['total_amount'].sum()
    total_rev = df['total_amount'].sum()

    return {
        "today_revenue": round(today_rev, 2),
        "weekly_revenue": round(week_rev, 2),
        "monthly_revenue": round(month_rev, 2),
        "total_revenue": round(total_rev, 2)
    }

def get_product_sales_stats(product_id):
    prod_id = int(product_id)
    # Query order items for this product (excluding cancelled)
    items = db.session.query(
        OrderItem.quantity,
        OrderItem.price,
        OrderModel.created_at
    ).join(OrderModel, OrderModel.id == OrderItem.order_id).filter(
        OrderItem.product_id == prod_id,
        OrderModel.order_status != "Cancelled"
    ).all()

    if not items:
        return {
            "daily_sales": 0,
            "weekly_sales": 0,
            "monthly_sales": 0,
            "total_sales": 0
        }

    df = pd.DataFrame(items, columns=['quantity', 'price', 'created_at'])
    df['quantity'] = df['quantity'].astype(int)
    df['created_at'] = pd.to_datetime(df['created_at'])

    now = datetime.now(pytz.timezone('Asia/Kolkata'))
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)

    if df['created_at'].dt.tz is None:
        df['created_at'] = df['created_at'].dt.tz_localize('Asia/Kolkata')

    daily_sales = df[df['created_at'] >= today_start]['quantity'].sum()
    weekly_sales = df[df['created_at'] >= week_start]['quantity'].sum()
    monthly_sales = df[df['created_at'] >= month_start]['quantity'].sum()
    total_sales = df['quantity'].sum()

    return {
        "daily_sales": int(daily_sales),
        "weekly_sales": int(weekly_sales),
        "monthly_sales": int(monthly_sales),
        "total_sales": int(total_sales)
    }

@cache_chart_file()
def generate_sales_chart():
    apply_premium_style()
    # Query order items (excluding cancelled)
    items = db.session.query(
        OrderItem.quantity,
        OrderModel.created_at
    ).join(OrderModel, OrderModel.id == OrderItem.order_id).filter(
        OrderModel.order_status != "Cancelled"
    ).all()

    filename = "sales_volume_trend.png"
    filepath = os.path.join(CHARTS_DIR, filename)

    if not items:
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.text(0.5, 0.5, 'No Sales Data Available', 
                horizontalalignment='center', verticalalignment='center',
                fontsize=14, color='#64748b', weight='bold')
        ax.set_axis_off()
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight')
        plt.close()
        return f"/static/uploads/charts/{filename}"

    df = pd.DataFrame(items, columns=['quantity', 'created_at'])
    df['quantity'] = df['quantity'].astype(int)
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['date'] = df['created_at'].dt.date

    end_date = datetime.now(pytz.timezone('Asia/Kolkata')).date()
    start_date = end_date - timedelta(days=29)
    all_dates = pd.date_range(start=start_date, end=end_date).date

    daily_sales = df.groupby('date')['quantity'].sum().reindex(all_dates, fill_value=0).reset_index()
    daily_sales.columns = ['date', 'units_sold']

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(daily_sales['date'], daily_sales['units_sold'], color='#10b981', linewidth=2, marker='o', markersize=4)
    ax.fill_between(daily_sales['date'], daily_sales['units_sold'], color='#10b981', alpha=0.1)

    ax.set_title("30-Day Sales Volume Trend (Units)", fontsize=12, fontweight='bold', pad=15, color='#1e293b')
    ax.set_ylabel("Units Sold", fontsize=10, color='#475569')
    plt.xticks(rotation=30, ha='right')
    
    ax.set_ylim(bottom=0)
    ax.yaxis.grid(True, linestyle='--', alpha=0.6, color='#cbd5e1')
    ax.xaxis.grid(False)

    plt.tight_layout()
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return f"/static/uploads/charts/{filename}"

def generate_revenue_chart():
    return generate_revenue_trend_chart()

@cache_chart_file()
def generate_orders_chart():
    apply_premium_style()
    # Query order counts (excluding cancelled)
    orders = db.session.query(
        OrderModel.id,
        OrderModel.created_at
    ).filter(OrderModel.order_status != "Cancelled").all()

    filename = "orders_volume_trend.png"
    filepath = os.path.join(CHARTS_DIR, filename)

    if not orders:
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.text(0.5, 0.5, 'No Orders Recorded Yet', 
                horizontalalignment='center', verticalalignment='center',
                fontsize=14, color='#64748b', weight='bold')
        ax.set_axis_off()
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight')
        plt.close()
        return f"/static/uploads/charts/{filename}"

    df = pd.DataFrame(orders, columns=['id', 'created_at'])
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['date'] = df['created_at'].dt.date

    end_date = datetime.now(pytz.timezone('Asia/Kolkata')).date()
    start_date = end_date - timedelta(days=29)
    all_dates = pd.date_range(start=start_date, end=end_date).date

    daily_orders = df.groupby('date')['id'].count().reindex(all_dates, fill_value=0).reset_index()
    daily_orders.columns = ['date', 'order_count']

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(daily_orders['date'], daily_orders['order_count'], color='#3b82f6', linewidth=2, marker='o', markersize=4)
    ax.fill_between(daily_orders['date'], daily_orders['order_count'], color='#3b82f6', alpha=0.1)

    ax.set_title("30-Day Orders Count Trend", fontsize=12, fontweight='bold', pad=15, color='#1e293b')
    ax.set_ylabel("Order Count", fontsize=10, color='#475569')
    plt.xticks(rotation=30, ha='right')
    
    ax.set_ylim(bottom=0)
    ax.yaxis.grid(True, linestyle='--', alpha=0.6, color='#cbd5e1')
    ax.xaxis.grid(False)

    plt.tight_layout()
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return f"/static/uploads/charts/{filename}"

@cache_chart_file()
def generate_product_revenue_chart(product_id):
    apply_premium_style()
    prod_id = int(product_id)
    product = ProductModel.query.get(prod_id)
    if not product:
        return None

    items = db.session.query(
        OrderItem.quantity,
        OrderItem.price,
        OrderModel.created_at
    ).join(OrderModel, OrderModel.id == OrderItem.order_id).filter(
        OrderItem.product_id == prod_id,
        OrderModel.order_status != "Cancelled"
    ).all()

    filename = f"product_{prod_id}_revenue.png"
    filepath = os.path.join(CHARTS_DIR, filename)

    if not items:
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.text(0.5, 0.5, 'No Revenue Data Available', 
                horizontalalignment='center', verticalalignment='center',
                fontsize=14, color='#64748b', weight='bold')
        ax.set_axis_off()
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight')
        plt.close()
        return f"/static/uploads/charts/{filename}"

    df = pd.DataFrame(items, columns=['quantity', 'price', 'created_at'])
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['date'] = df['created_at'].dt.date
    df['revenue'] = df['quantity'] * df['price'].astype(float)

    daily_revenue = df.groupby('date')['revenue'].sum().reset_index()

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(daily_revenue['date'], daily_revenue['revenue'], marker='o', color='#10b981', 
            linewidth=2, label='Daily Revenue (₹)')
    
    ax.set_title(f"Revenue Trend: {product.name}", fontsize=12, fontweight='bold', pad=15, color='#1e293b')
    ax.set_xlabel("Date", fontsize=10, color='#475569')
    ax.set_ylabel("Revenue (₹)", fontsize=10, color='#475569')
    plt.xticks(rotation=30, ha='right')
    ax.set_ylim(bottom=0)
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return f"/static/uploads/charts/{filename}"

@cache_chart_file()
def generate_product_orders_chart(product_id):
    apply_premium_style()
    prod_id = int(product_id)
    product = ProductModel.query.get(prod_id)
    if not product:
        return None

    items = db.session.query(
        OrderItem.order_id,
        OrderModel.created_at
    ).join(OrderModel, OrderModel.id == OrderItem.order_id).filter(
        OrderItem.product_id == prod_id,
        OrderModel.order_status != "Cancelled"
    ).all()

    filename = f"product_{prod_id}_orders.png"
    filepath = os.path.join(CHARTS_DIR, filename)

    if not items:
        fig, ax = plt.subplots(figsize=(8, 4))
        ax.text(0.5, 0.5, 'No Orders Data Available', 
                horizontalalignment='center', verticalalignment='center',
                fontsize=14, color='#64748b', weight='bold')
        ax.set_axis_off()
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight')
        plt.close()
        return f"/static/uploads/charts/{filename}"

    df = pd.DataFrame(items, columns=['order_id', 'created_at'])
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['date'] = df['created_at'].dt.date

    daily_orders = df.groupby('date')['order_id'].nunique().reset_index()

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(daily_orders['date'], daily_orders['order_id'], marker='o', color='#6366f1', 
            linewidth=2, label='Daily Orders')
    
    ax.set_title(f"Orders Trend: {product.name}", fontsize=12, fontweight='bold', pad=15, color='#1e293b')
    ax.set_xlabel("Date", fontsize=10, color='#475569')
    ax.set_ylabel("Order Count", fontsize=10, color='#475569')
    plt.xticks(rotation=30, ha='right')
    ax.set_ylim(bottom=0)
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return f"/static/uploads/charts/{filename}"

@cache_chart_file()
def generate_product_stock_chart(product_id):
    apply_premium_style()
    prod_id = int(product_id)
    product = ProductModel.query.get(prod_id)
    if not product:
        return None

    from backend.models.product import StockHistoryModel
    records = StockHistoryModel.query.filter_by(product_id=prod_id).order_by(StockHistoryModel.created_at.asc()).all()

    filename = f"product_{prod_id}_stock.png"
    filepath = os.path.join(CHARTS_DIR, filename)

    if not records:
        fig, ax = plt.subplots(figsize=(8, 4))
        dates = [datetime.now() - timedelta(days=7), datetime.now()]
        ax.plot(dates, [product.stock, product.stock], color='#f59e0b', linewidth=2, label='Current Stock')
        ax.set_title(f"Stock Level Trend: {product.name}", fontsize=12, fontweight='bold', pad=15, color='#1e293b')
        ax.set_xlabel("Date", fontsize=10, color='#475569')
        ax.set_ylabel("Stock Level", fontsize=10, color='#475569')
        ax.set_ylim(bottom=0)
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight')
        plt.close()
        return f"/static/uploads/charts/{filename}"

    df = pd.DataFrame([{
        'created_at': r.created_at,
        'new_stock': r.new_stock
    } for r in records])
    
    df['created_at'] = pd.to_datetime(df['created_at'])
    df = df.sort_values('created_at')
    
    if len(df) == 1:
        start_time = df.iloc[0]['created_at'] - timedelta(days=1)
        old_stock = records[0].old_stock
        df = pd.concat([pd.DataFrame([{'created_at': start_time, 'new_stock': old_stock}]), df], ignore_index=True)

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.step(df['created_at'], df['new_stock'], where='post', color='#f59e0b', linewidth=2, label='Stock Level')
    
    ax.set_title(f"Stock Level Trend: {product.name}", fontsize=12, fontweight='bold', pad=15, color='#1e293b')
    ax.set_xlabel("Date", fontsize=10, color='#475569')
    ax.set_ylabel("Stock Level", fontsize=10, color='#475569')
    plt.xticks(rotation=30, ha='right')
    ax.set_ylim(bottom=0)
    
    plt.tight_layout()
    plt.savefig(filepath, dpi=150, bbox_inches='tight')
    plt.close()

    return f"/static/uploads/charts/{filename}"
