from datetime import datetime
from backend.extensions import db

class TransactionModel(db.Model):
    __tablename__ = 'transactions'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)

    transaction_id = db.Column(db.String(100), unique=True, index=True, nullable=False)
    order_id = db.Column(db.String(100), db.ForeignKey('orders.id', ondelete='SET NULL'), index=True, nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True, nullable=True)
    
    payment_gateway = db.Column(db.String(50), default='razorpay', nullable=False)  # razorpay, cashfree, phonepe, stripe, payu, dummy
    gateway_order_id = db.Column(db.String(100), nullable=True)
    gateway_payment_id = db.Column(db.String(100), nullable=True)
    payment_method = db.Column(db.String(50), nullable=True)     # card, upi, netbanking, wallet, cod
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), default='INR')
    
    payment_status = db.Column(db.String(50), index=True, default='pending')  # pending, authorized, captured, failed, refunded
    transaction_status = db.Column(db.String(50), default='created')           # created, processing, completed, failed
    
    gateway_response = db.Column(db.JSON, nullable=True)
    failure_reason = db.Column(db.Text, nullable=True)
    refunded_amount = db.Column(db.Numeric(10, 2), default=0.0)
    
    payment_reference = db.Column(db.String(100), nullable=True)
    payment_source = db.Column(db.String(50), default='web', nullable=True)
    environment = db.Column(db.String(20), default='DEV', nullable=False)     # DEV, QA, PROD
    webhook_verified = db.Column(db.Boolean, default=False)
    webhook_received_at = db.Column(db.DateTime, nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    
    payment_time = db.Column(db.DateTime, index=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    order = db.relationship('OrderModel', foreign_keys=[order_id], primaryjoin='TransactionModel.order_id == OrderModel.id', backref='transactions', lazy='select')
    customer = db.relationship('UserModel', foreign_keys=[customer_id], primaryjoin='TransactionModel.customer_id == UserModel.id', backref='transactions', lazy='select')


    # Backward compatibility property for legacy code referencing tx.status
    @property
    def status(self):
        return self.payment_status or self.transaction_status

    @status.setter
    def status(self, val):
        self.payment_status = val
        self.transaction_status = val

    def to_dict(self, include_details=False):
        cust_name = None
        cust_email = None
        if self.customer:
            cust_name = getattr(self.customer, 'name', None) or getattr(self.customer, 'email', None)
            cust_email = getattr(self.customer, 'email', None)

        res = {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "order_id": self.order_id,
            "customer_id": self.customer_id,
            "customer_name": cust_name,
            "customer_email": cust_email,
            "payment_gateway": self.payment_gateway,
            "gateway_order_id": self.gateway_order_id,
            "gateway_payment_id": self.gateway_payment_id,
            "payment_method": self.payment_method or "N/A",
            "amount": float(self.amount) if self.amount is not None else 0.0,
            "currency": self.currency or "INR",
            "payment_status": self.payment_status,
            "transaction_status": self.transaction_status,
            "refunded_amount": float(self.refunded_amount) if self.refunded_amount is not None else 0.0,
            "environment": self.environment or "DEV",
            "webhook_verified": bool(self.webhook_verified),
            "payment_time": self.payment_time.isoformat() if self.payment_time else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "status": self.status
        }

        if include_details:
            res.update({
                "gateway_response": self.gateway_response or {},
                "failure_reason": self.failure_reason,
                "payment_reference": self.payment_reference,
                "payment_source": self.payment_source,
                "webhook_received_at": self.webhook_received_at.isoformat() if self.webhook_received_at else None,
                "remarks": self.remarks
            })

        return res
