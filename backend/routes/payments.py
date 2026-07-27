from flask import Blueprint, request, jsonify
from datetime import datetime, date, timedelta
from sqlalchemy import func, or_, and_, desc, asc
from sqlalchemy.orm import joinedload
from backend.extensions import db
from backend.models.transaction import TransactionModel
from backend.models.order import OrderModel
from backend.models.user import UserModel

from backend.middleware.auth import admin_required
from backend.config import Config

payments_bp = Blueprint('admin_payments', __name__)

@payments_bp.route('', methods=['GET'])
@admin_required
def get_payments(current_user):
    """
    Paginated, searchable, filterable, and sortable Payment Transactions endpoint for Admin.
    """
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    if limit > 100:
        limit = 100

    search = request.args.get('search', '').strip()
    status = request.args.get('status', '').strip()
    gateway = request.args.get('gateway', '').strip()
    method = request.args.get('method', '').strip()
    environment = request.args.get('environment', '').strip()
    sort = request.args.get('sort', 'latest').strip()

    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()
    min_amount = request.args.get('min_amount', type=float)
    max_amount = request.args.get('max_amount', type=float)

    query = TransactionModel.query.options(
        joinedload(TransactionModel.customer),
        joinedload(TransactionModel.order)
    )

    # Search filter across Transaction ID, Order ID, Gateway Payment ID, Customer Name/Email
    if search:
        search_pattern = f"%{search}%"
        query = query.outerjoin(UserModel, TransactionModel.customer_id == UserModel.id).filter(
            or_(
                TransactionModel.transaction_id.ilike(search_pattern),
                TransactionModel.order_id.ilike(search_pattern),
                TransactionModel.gateway_payment_id.ilike(search_pattern),
                TransactionModel.gateway_order_id.ilike(search_pattern),
                UserModel.name.ilike(search_pattern),
                UserModel.email.ilike(search_pattern)
            )
        )

    # Filters
    if status and status.lower() != 'all':
        query = query.filter(func.lower(TransactionModel.payment_status) == status.lower())

    if gateway and gateway.lower() != 'all':
        query = query.filter(func.lower(TransactionModel.payment_gateway) == gateway.lower())

    if method and method.lower() != 'all':
        query = query.filter(func.lower(TransactionModel.payment_method) == method.lower())

    if environment and environment.lower() != 'all':
        query = query.filter(func.upper(TransactionModel.environment) == environment.upper())

    if min_amount is not None:
        query = query.filter(TransactionModel.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(TransactionModel.amount <= max_amount)

    if start_date:
        try:
            s_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(TransactionModel.created_at >= s_dt)
        except ValueError:
            pass

    if end_date:
        try:
            e_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(TransactionModel.created_at < e_dt)
        except ValueError:
            pass

    # Sorting
    if sort == 'oldest':
        query = query.order_by(asc(TransactionModel.created_at))
    elif sort == 'highest_amount':
        query = query.order_by(desc(TransactionModel.amount))
    elif sort == 'lowest_amount':
        query = query.order_by(asc(TransactionModel.amount))
    elif sort == 'status':
        query = query.order_by(asc(TransactionModel.payment_status))
    elif sort == 'gateway':
        query = query.order_by(asc(TransactionModel.payment_gateway))
    else:  # latest
        query = query.order_by(desc(TransactionModel.created_at))

    total_count = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        "success": True,
        "items": [item.to_dict(include_details=False) for item in items],
        "pagination": {
            "current_page": page,
            "page_size": limit,
            "total_count": total_count,
            "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1
        }
    }), 200


@payments_bp.route('/analytics', methods=['GET'])
@admin_required
def get_payment_analytics(current_user):
    """
    Analytics summary cards: Total Payments, Today's Payments, Successful, Pending, Failed,
    Refunded, Total Revenue, Monthly Revenue, Average Order Value (AOV).
    """
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    month_start = datetime(now.year, now.month, 1)

    total_payments = TransactionModel.query.count()
    today_payments = TransactionModel.query.filter(TransactionModel.created_at >= today_start).count()

    successful_count = TransactionModel.query.filter(
        func.lower(TransactionModel.payment_status).in_(['captured', 'successful', 'completed', 'paid'])
    ).count()

    pending_count = TransactionModel.query.filter(
        func.lower(TransactionModel.payment_status).in_(['pending', 'processing', 'authorized', 'created'])
    ).count()

    failed_count = TransactionModel.query.filter(
        func.lower(TransactionModel.payment_status) == 'failed'
    ).count()

    refunded_count = TransactionModel.query.filter(
        func.lower(TransactionModel.payment_status) == 'refunded'
    ).count()

    # Revenue metrics (Successful transactions only)
    successful_query = TransactionModel.query.filter(
        func.lower(TransactionModel.payment_status).in_(['captured', 'successful', 'completed', 'paid'])
    )

    total_revenue = db.session.query(func.coalesce(func.sum(TransactionModel.amount), 0.0)).filter(
        func.lower(TransactionModel.payment_status).in_(['captured', 'successful', 'completed', 'paid'])
    ).scalar()

    monthly_revenue = db.session.query(func.coalesce(func.sum(TransactionModel.amount), 0.0)).filter(
        func.lower(TransactionModel.payment_status).in_(['captured', 'successful', 'completed', 'paid']),
        TransactionModel.created_at >= month_start
    ).scalar()

    today_revenue = db.session.query(func.coalesce(func.sum(TransactionModel.amount), 0.0)).filter(
        func.lower(TransactionModel.payment_status).in_(['captured', 'successful', 'completed', 'paid']),
        TransactionModel.created_at >= today_start
    ).scalar()

    aov = float(total_revenue / successful_count) if successful_count > 0 else 0.0

    return jsonify({
        "success": True,
        "analytics": {
            "total_payments": total_payments,
            "today_payments": today_payments,
            "successful_payments": successful_count,
            "pending_payments": pending_count,
            "failed_payments": failed_count,
            "refunded_payments": refunded_count,
            "total_revenue": float(total_revenue),
            "monthly_revenue": float(monthly_revenue),
            "today_revenue": float(today_revenue),
            "average_order_value": round(aov, 2)
        }
    }), 200


@payments_bp.route('/<int:transaction_id>', methods=['GET'])
@admin_required
def get_payment_details(current_user, transaction_id):
    """
    Detailed payload for Payment Inspection Side-Panel Drawer.
    """
    tx = TransactionModel.query.options(
        joinedload(TransactionModel.customer),
        joinedload(TransactionModel.order)
    ).get(transaction_id)

    if not tx:
        return jsonify({"success": False, "error": "Transaction record not found"}), 404

    data = tx.to_dict(include_details=True)

    # Order details summary
    order_data = None
    if tx.order:
        order_data = {
            "id": tx.order.id,
            "order_number": getattr(tx.order, 'order_number', None) or str(tx.order.id),
            "total_amount": float(tx.order.total_amount) if hasattr(tx.order, 'total_amount') and tx.order.total_amount else data["amount"],
            "order_status": getattr(tx.order, 'status', 'N/A'),
            "items_count": len(tx.order.order_items) if hasattr(tx.order, 'order_items') and tx.order.order_items else 0,
            "created_at": tx.order.created_at.isoformat() if hasattr(tx.order, 'created_at') and tx.order.created_at else None
        }

    # Customer details summary
    customer_data = None
    if tx.customer:
        customer_data = {
            "id": tx.customer.id,
            "name": getattr(tx.customer, 'name', None) or getattr(tx.customer, 'email', None),
            "email": getattr(tx.customer, 'email', None),
            "phone": getattr(tx.customer, 'mobile', None) or getattr(tx.customer, 'phone', 'N/A')
        }

    data["order_summary"] = order_data
    data["customer_summary"] = customer_data

    # Timeline event log
    timeline = [
        {
            "title": "Transaction Created",
            "timestamp": tx.created_at.isoformat() if tx.created_at else None,
            "status": "created",
            "detail": f"Payment initiated via {tx.payment_gateway.upper()} in {tx.environment} mode."
        }
    ]

    if tx.payment_time:
        timeline.append({
            "title": f"Payment {tx.payment_status.capitalize()}",
            "timestamp": tx.payment_time.isoformat(),
            "status": tx.payment_status,
            "detail": f"Gateway Order ID: {tx.gateway_order_id or 'N/A'}, Payment ID: {tx.gateway_payment_id or 'N/A'}"
        })

    if tx.failure_reason:
        timeline.append({
            "title": "Payment Failure Logged",
            "timestamp": tx.updated_at.isoformat() if tx.updated_at else None,
            "status": "failed",
            "detail": tx.failure_reason
        })

    if float(tx.refunded_amount or 0) > 0:
        timeline.append({
            "title": "Refund Processed",
            "timestamp": tx.updated_at.isoformat() if tx.updated_at else None,
            "status": "refunded",
            "detail": f"Refunded Amount: ₹{tx.refunded_amount}"
        })

    data["timeline"] = timeline

    return jsonify({"success": True, "transaction": data}), 200


@payments_bp.route('/<int:transaction_id>/refund', methods=['POST'])
@admin_required
def process_payment_refund(current_user, transaction_id):
    """
    Process Full or Partial Refund for a captured payment.
    """
    tx = TransactionModel.query.get(transaction_id)
    if not tx:
        return jsonify({"success": False, "error": "Transaction not found"}), 404

    payload = request.get_json() or {}
    refund_amount = payload.get('amount')
    reason = payload.get('reason', 'Admin initiated refund')

    if not refund_amount:
        refund_amount = float(tx.amount) - float(tx.refunded_amount or 0.0)

    try:
        refund_amount = float(refund_amount)
    except ValueError:
        return jsonify({"success": False, "error": "Invalid refund amount"}), 400

    available_refundable = float(tx.amount) - float(tx.refunded_amount or 0.0)
    if refund_amount <= 0 or refund_amount > available_refundable:
        return jsonify({"success": False, "error": f"Refund amount must be between ₹1 and ₹{available_refundable}"}), 400

    # In DEV environment, perform dummy refund log
    if Config.ENVIRONMENT == 'DEV':
        tx.refunded_amount = float(tx.refunded_amount or 0.0) + refund_amount
        if tx.refunded_amount >= float(tx.amount):
            tx.payment_status = 'refunded'
            tx.transaction_status = 'refunded'
        tx.remarks = f"[DEV REFUND] {reason} at {datetime.utcnow().isoformat()}"
        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Successfully processed ₹{refund_amount} dummy refund in DEV environment.",
            "transaction": tx.to_dict(include_details=True)
        }), 200

    # QA / PROD gateway refund logic
    from backend.utils.payment_gateway import PaymentGatewayManager
    gateway = PaymentGatewayManager.get_gateway()
    refund_res = gateway.process_refund(
        payment_id=tx.gateway_payment_id or tx.transaction_id,
        amount=refund_amount,
        reason=reason
    )

    if refund_res.get('success'):
        tx.refunded_amount = float(tx.refunded_amount or 0.0) + refund_amount
        if tx.refunded_amount >= float(tx.amount):
            tx.payment_status = 'refunded'
            tx.transaction_status = 'refunded'
        tx.remarks = f"[{Config.ENVIRONMENT} REFUND] {reason} (Refund ID: {refund_res.get('refund_id')})"
        db.session.commit()
        return jsonify({"success": True, "message": "Refund processed successfully", "transaction": tx.to_dict()}), 200
    else:
        return jsonify({"success": False, "error": refund_res.get('error', 'Refund failed at gateway')}), 400


@payments_bp.route('/seed-demo', methods=['POST'])
@admin_required
def seed_demo_transactions(current_user):
    """
    Developer helper endpoint to seed demo transaction records for DEV/QA UI testing if database is empty.
    """
    if TransactionModel.query.count() > 0:
        return jsonify({"success": True, "message": "Transactions already exist."}), 200

    demo_records = [
        {
            "transaction_id": "TXN_DEV_88001",
            "order_id": "ORD-1001",
            "customer_id": 1,
            "payment_gateway": "razorpay",
            "gateway_order_id": "order_qa_razor_88001",
            "gateway_payment_id": "pay_qa_razor_88001",
            "payment_method": "upi",
            "amount": 45000.00,
            "currency": "INR",
            "payment_status": "captured",
            "transaction_status": "completed",
            "environment": Config.ENVIRONMENT,
            "payment_time": datetime.utcnow() - timedelta(hours=2),
            "gateway_response": {"status": "captured", "method": "upi", "vpa": "customer@okaxis"}
        },
        {
            "transaction_id": "TXN_DEV_88002",
            "order_id": "ORD-1002",
            "customer_id": 1,
            "payment_gateway": "cashfree",
            "gateway_order_id": "cf_order_88002",
            "gateway_payment_id": "cf_pay_88002",
            "payment_method": "card",
            "amount": 89000.00,
            "currency": "INR",
            "payment_status": "captured",
            "transaction_status": "completed",
            "environment": Config.ENVIRONMENT,
            "payment_time": datetime.utcnow() - timedelta(days=1),
            "gateway_response": {"status": "SUCCESS", "payment_mode": "CREDIT_CARD"}
        },
        {
            "transaction_id": "TXN_DEV_88003",
            "order_id": "ORD-1003",
            "customer_id": 1,
            "payment_gateway": "phonepe",
            "gateway_order_id": "pp_order_88003",
            "gateway_payment_id": "pp_pay_88003",
            "payment_method": "upi",
            "amount": 12500.00,
            "currency": "INR",
            "payment_status": "pending",
            "transaction_status": "processing",
            "environment": Config.ENVIRONMENT,
            "payment_time": None,
            "gateway_response": {"status": "PAYMENT_PENDING"}
        },
        {
            "transaction_id": "TXN_DEV_88004",
            "order_id": "ORD-1004",
            "customer_id": 1,
            "payment_gateway": "stripe",
            "gateway_order_id": "pi_stripe_88004",
            "gateway_payment_id": "py_stripe_88004",
            "payment_method": "card",
            "amount": 62000.00,
            "currency": "INR",
            "payment_status": "failed",
            "transaction_status": "failed",
            "failure_reason": "Insufficient funds on card",
            "environment": Config.ENVIRONMENT,
            "payment_time": datetime.utcnow() - timedelta(hours=5),
            "gateway_response": {"error": {"code": "card_declined", "decline_code": "insufficient_funds"}}
        },
        {
            "transaction_id": "TXN_DEV_88005",
            "order_id": "ORD-1005",
            "customer_id": 1,
            "payment_gateway": "razorpay",
            "gateway_order_id": "order_qa_razor_88005",
            "gateway_payment_id": "pay_qa_razor_88005",
            "payment_method": "netbanking",
            "amount": 34000.00,
            "currency": "INR",
            "payment_status": "refunded",
            "transaction_status": "refunded",
            "refunded_amount": 34000.00,
            "environment": Config.ENVIRONMENT,
            "payment_time": datetime.utcnow() - timedelta(days=3),
            "gateway_response": {"status": "refunded", "refund_id": "rfnd_88005"}
        }
    ]

    for rec in demo_records:
        tx = TransactionModel(**rec)
        db.session.add(tx)

    db.session.commit()
    return jsonify({"success": True, "message": f"Seeded {len(demo_records)} demo transactions successfully."}), 201
