from abc import ABC, abstractmethod
import os
import uuid
import datetime
from backend.config import Config

class BasePaymentGateway(ABC):
    @abstractmethod
    def create_order(self, amount, currency="INR", order_id=None, notes=None):
        pass

    @abstractmethod
    def verify_payment(self, payment_details):
        pass

    @abstractmethod
    def process_webhook(self, payload, signature):
        pass

    @abstractmethod
    def refund(self, payment_id, amount=None):
        pass


class DisabledPaymentGateway(BasePaymentGateway):
    """
    Returned when ENABLE_PAYMENT is False (e.g. in DEV mode).
    Prevents external network calls and provides helpful messages.
    """
    def create_order(self, amount, currency="INR", order_id=None, notes=None):
        return {
            "success": False,
            "status": "disabled",
            "message": f"Payment gateway is disabled by feature flag in {Config.ENVIRONMENT} mode."
        }

    def verify_payment(self, payment_details):
        return {
            "success": False,
            "status": "disabled",
            "message": f"Payment verification is disabled in {Config.ENVIRONMENT} mode."
        }

    def process_webhook(self, payload, signature):
        return {
            "success": False,
            "status": "disabled",
            "message": f"Webhook processing is disabled in {Config.ENVIRONMENT} mode."
        }

    def refund(self, payment_id, amount=None):
        return {
            "success": False,
            "status": "disabled",
            "message": f"Refund is disabled in {Config.ENVIRONMENT} mode."
        }


class RazorpayGateway(BasePaymentGateway):
    def __init__(self, key_id, key_secret, is_sandbox=False):
        self.key_id = key_id
        self.key_secret = key_secret
        self.is_sandbox = is_sandbox

    def create_order(self, amount, currency="INR", order_id=None, notes=None):
        if not self.key_id or not self.key_secret:
            if self.is_sandbox:
                # Return mock sandbox order in QA mode if credentials missing
                mock_order_id = f"order_qa_{uuid.uuid4().hex[:10]}"
                return {
                    "success": True,
                    "mode": "QA_SANDBOX_MOCK",
                    "gateway": "razorpay",
                    "gateway_order_id": mock_order_id,
                    "amount": amount,
                    "currency": currency,
                    "notes": notes or {}
                }
            return {
                "success": False,
                "message": "Razorpay credentials not configured for active environment."
            }

        try:
            import razorpay
            client = razorpay.Client(auth=(self.key_id, self.key_secret))
            data = {
                "amount": int(amount * 100),  # In paise
                "currency": currency,
                "receipt": str(order_id) if order_id else f"rcpt_{uuid.uuid4().hex[:8]}",
                "notes": notes or {}
            }
            res = client.order.create(data=data)
            return {
                "success": True,
                "gateway": "razorpay",
                "gateway_order_id": res.get("id"),
                "amount": amount,
                "currency": currency,
                "response": res
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def verify_payment(self, payment_details):
        if self.is_sandbox and (not self.key_id or not self.key_secret):
            return {"success": True, "mode": "QA_SANDBOX_MOCK", "status": "captured"}

        try:
            import razorpay
            client = razorpay.Client(auth=(self.key_id, self.key_secret))
            client.utility.verify_payment_signature(payment_details)
            return {"success": True, "status": "captured"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def process_webhook(self, payload, signature):
        if not Config.ENABLE_WEBHOOKS:
            return {"success": False, "message": "Webhooks disabled by feature flag"}
        return {"success": True, "event": payload.get("event")}

    def refund(self, payment_id, amount=None):
        try:
            import razorpay
            client = razorpay.Client(auth=(self.key_id, self.key_secret))
            data = {}
            if amount:
                data["amount"] = int(amount * 100)
            res = client.payment.refund(payment_id, data)
            return {"success": True, "refund_id": res.get("id")}
        except Exception as e:
            return {"success": False, "error": str(e)}


class CashfreeGateway(BasePaymentGateway):
    def __init__(self, app_id=None, secret_key=None, is_sandbox=False):
        self.app_id = app_id
        self.secret_key = secret_key
        self.is_sandbox = is_sandbox

    def create_order(self, amount, currency="INR", order_id=None, notes=None):
        return {"success": True, "gateway": "cashfree", "gateway_order_id": f"cf_{uuid.uuid4().hex[:8]}"}

    def verify_payment(self, payment_details):
        return {"success": True, "gateway": "cashfree"}

    def process_webhook(self, payload, signature):
        return {"success": True, "gateway": "cashfree"}

    def refund(self, payment_id, amount=None):
        return {"success": True, "gateway": "cashfree"}


class PhonePeGateway(BasePaymentGateway):
    def __init__(self, merchant_id=None, salt_key=None, is_sandbox=False):
        self.merchant_id = merchant_id
        self.salt_key = salt_key
        self.is_sandbox = is_sandbox

    def create_order(self, amount, currency="INR", order_id=None, notes=None):
        return {"success": True, "gateway": "phonepe", "gateway_order_id": f"pp_{uuid.uuid4().hex[:8]}"}

    def verify_payment(self, payment_details):
        return {"success": True, "gateway": "phonepe"}

    def process_webhook(self, payload, signature):
        return {"success": True, "gateway": "phonepe"}

    def refund(self, payment_id, amount=None):
        return {"success": True, "gateway": "phonepe"}


class StripeGateway(BasePaymentGateway):
    def __init__(self, api_key=None):
        self.api_key = api_key

    def create_order(self, amount, currency="INR", order_id=None, notes=None):
        return {"success": True, "gateway": "stripe", "gateway_order_id": f"pi_{uuid.uuid4().hex[:8]}"}

    def verify_payment(self, payment_details):
        return {"success": True, "gateway": "stripe"}

    def process_webhook(self, payload, signature):
        return {"success": True, "gateway": "stripe"}

    def refund(self, payment_id, amount=None):
        return {"success": True, "gateway": "stripe"}


class PayUGateway(BasePaymentGateway):
    def __init__(self, merchant_key=None, merchant_salt=None):
        self.merchant_key = merchant_key
        self.merchant_salt = merchant_salt

    def create_order(self, amount, currency="INR", order_id=None, notes=None):
        return {"success": True, "gateway": "payu", "gateway_order_id": f"payu_{uuid.uuid4().hex[:8]}"}

    def verify_payment(self, payment_details):
        return {"success": True, "gateway": "payu"}

    def process_webhook(self, payload, signature):
        return {"success": True, "gateway": "payu"}

    def refund(self, payment_id, amount=None):
        return {"success": True, "gateway": "payu"}


class PaymentGatewayManager:
    """
    Central Manager to retrieve configured payment gateway instance based on
    ENVIRONMENT, feature flag (ENABLE_PAYMENT), and selected provider.
    """
    @staticmethod
    def get_gateway(gateway_name="razorpay") -> BasePaymentGateway:
        if not Config.ENABLE_PAYMENT:
            return DisabledPaymentGateway()

        gateway_name = (gateway_name or "razorpay").lower()

        if gateway_name == "razorpay":
            return RazorpayGateway(
                key_id=Config.RAZORPAY_KEY_ID,
                key_secret=Config.RAZORPAY_KEY_SECRET,
                is_sandbox=Config.IS_QA
            )
        elif gateway_name == "cashfree":
            return CashfreeGateway(is_sandbox=Config.IS_QA)
        elif gateway_name == "phonepe":
            return PhonePeGateway(is_sandbox=Config.IS_QA)
        elif gateway_name == "stripe":
            return StripeGateway()
        elif gateway_name == "payu":
            return PayUGateway()
        else:
            return DisabledPaymentGateway()
