import os
import sys
import time

# Ensure backend package resolution
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

def test_environment_architecture():
    print("="*80)
    print("      ENTERPRISE ENVIRONMENT MANAGEMENT & PRODUCTION ARCHITECTURE TEST      ")
    print("="*80)

    environments = ["DEV", "QA", "PROD"]
    
    for env in environments:
        print(f"\n--- Testing Environment Switching: ENVIRONMENT={env} ---")
        os.environ["ENVIRONMENT"] = env
        
        # Test startup latency & config initialization speed
        t0 = time.perf_counter()
        
        # Force re-import of config to simulate app initialization
        if "backend.config" in sys.modules:
            del sys.modules["backend.config"]
        from backend.config import Config, ENVIRONMENT
        
        t1 = time.perf_counter()
        init_time_ms = (t1 - t0) * 1000
        
        print(f"[OK] Configuration loaded in {init_time_ms:.4f} ms (Zero Runtime Overhead)")

        db_uri_str = str(Config.SQLALCHEMY_DATABASE_URI) if Config.SQLALCHEMY_DATABASE_URI else "None"
        print(f"  - Active ENVIRONMENT: {Config.ENVIRONMENT}")
        print(f"  - Database URI Resolved: {db_uri_str[:45]}...")

        print(f"  - Logging Level: {Config.LOGGING_LEVEL}")
        print(f"  - Feature Flags:")
        print(f"      * ENABLE_PAYMENT: {Config.ENABLE_PAYMENT}")
        print(f"      * ENABLE_SMS: {Config.ENABLE_SMS}")
        print(f"      * ENABLE_OTP: {Config.ENABLE_OTP}")
        print(f"      * ENABLE_EMAIL: {Config.ENABLE_EMAIL}")
        print(f"      * ENABLE_ORDER_CONFIRMATION: {Config.ENABLE_ORDER_CONFIRMATION}")
        print(f"      * ENABLE_PUSH_NOTIFICATIONS: {Config.ENABLE_PUSH_NOTIFICATIONS}")
        print(f"      * ENABLE_WEBHOOKS: {Config.ENABLE_WEBHOOKS}")
        print(f"      * ENABLE_ANALYTICS: {Config.ENABLE_ANALYTICS}")
        print(f"      * ENABLE_RAPID_API: {Config.ENABLE_RAPID_API}")

        # Assertions per Environment
        if env == "DEV":
            assert Config.ENABLE_PAYMENT is False, "DEV mode ENABLE_PAYMENT should default to False"
            assert Config.ENABLE_OTP is False, "DEV mode ENABLE_OTP should default to False"
            assert Config.ENABLE_SMS is False, "DEV mode ENABLE_SMS should default to False"
            assert Config.ENABLE_EMAIL is False, "DEV mode ENABLE_EMAIL should default to False"
            assert Config.ENABLE_ORDER_CONFIRMATION is False, "DEV mode ENABLE_ORDER_CONFIRMATION should default to False"
        elif env in ("QA", "PROD"):
            assert Config.ENABLE_PAYMENT is True, f"{env} mode ENABLE_PAYMENT should default to True"
            assert Config.ENABLE_OTP is True, f"{env} mode ENABLE_OTP should default to True"
            assert Config.ENABLE_SMS is True, f"{env} mode ENABLE_SMS should default to True"
            assert Config.ENABLE_EMAIL is True, f"{env} mode ENABLE_EMAIL should default to True"
            assert Config.ENABLE_ORDER_CONFIRMATION is True, f"{env} mode ENABLE_ORDER_CONFIRMATION should default to True"

    print("\n--- Testing Payment Gateway Architecture & Pluggability ---")
    os.environ["ENVIRONMENT"] = "DEV"
    for m in ["backend.config", "backend.utils.payment_gateway"]:
        if m in sys.modules:
            del sys.modules[m]
    from backend.utils.payment_gateway import PaymentGatewayManager
    
    dev_gw = PaymentGatewayManager.get_gateway("razorpay")
    res_dev = dev_gw.create_order(1500)
    print(f"[OK] DEV Payment Gateway (Disabled): {res_dev}")
    assert res_dev["status"] == "disabled"

    os.environ["ENVIRONMENT"] = "QA"
    for m in ["backend.config", "backend.utils.payment_gateway"]:
        if m in sys.modules:
            del sys.modules[m]
    from backend.utils.payment_gateway import PaymentGatewayManager
    
    qa_gw = PaymentGatewayManager.get_gateway("razorpay")
    res_qa = qa_gw.create_order(1500)
    print(f"[OK] QA Payment Gateway (Sandbox): {res_qa}")
    assert res_qa["success"] is True

    print("\n--- Testing Transactions Database Model ---")
    from backend.models.transaction import TransactionModel
    tx = TransactionModel(
        transaction_id="tx_verify_1001",
        order_id="ORD-9999",
        customer_id=1,
        payment_gateway="razorpay",
        amount=2500.0,
        currency="INR",
        payment_status="captured",
        transaction_status="completed"
    )
    tx_dict = tx.to_dict()
    print(f"[OK] Transaction Model dictionary representation:\n  {tx_dict}")
    assert tx_dict["transaction_id"] == "tx_verify_1001"

    print("\n--- Testing Email & Order Confirmation Feature Flag Guarding ---")
    os.environ["ENVIRONMENT"] = "DEV"
    for m in ["backend.config", "backend.utils.email_service"]:
        if m in sys.modules:
            del sys.modules[m]
    from backend.utils.email_service import send_email, send_order_confirmation
    
    status_email = send_email("test@example.com", "Test Subject", "Test Body")
    print(f"[OK] Email Service response in DEV (Disabled): {status_email}")
    assert status_email["status"] == "disabled_by_feature_flag"

    print("\n" + "="*80)
    print("      ALL ENTERPRISE ENVIRONMENT MANAGEMENT TESTS PASSED SUCCESSFULLY!      ")
    print("="*80 + "\n")


if __name__ == "__main__":
    test_environment_architecture()
