def _get_base_template(content_html, preview_text="SSJewellery Notification"):
    """
    Renders the unified luxury HTML email wrapper for SSJewellery.
    Colors: Royal Purple (#3F1D5A), Luxury Gold (#D4A75F), Slate text (#1E293B).
    """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SSJewellery</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
        }}
        .email-container {{
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
        }}
        .header {{
            background: linear-gradient(135deg, #3F1D5A 0%, #261138 100%);
            padding: 32px 24px;
            text-align: center;
            border-bottom: 3px solid #D4A75F;
        }}
        .header h1 {{
            color: #D4A75F;
            margin: 0;
            font-size: 26px;
            font-weight: 900;
            letter-spacing: 2px;
            text-transform: uppercase;
        }}
        .header p {{
            color: #e2e8f0;
            margin: 6px 0 0 0;
            font-size: 11px;
            letter-spacing: 3px;
            text-transform: uppercase;
        }}
        .body-content {{
            padding: 32px 28px;
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
        }}
        .footer strong {{
            color: #3F1D5A;
        }}
        .otp-box {{
            background: linear-gradient(135deg, #fdfbf7 0%, #f7f1e5 100%);
            border: 2px dashed #D4A75F;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin: 24px 0;
        }}
        .otp-code {{
            font-size: 32px;
            font-weight: 900;
            letter-spacing: 8px;
            color: #3F1D5A;
            margin: 8px 0;
            font-family: monospace;
        }}
        .btn {{
            display: inline-block;
            background: linear-gradient(135deg, #3F1D5A 0%, #522775 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 13px;
            letter-spacing: 0.5px;
            margin-top: 16px;
            border: 1px solid #D4A75F;
        }}
        .info-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }}
        .info-table th {{
            background-color: #f8fafc;
            color: #475569;
            padding: 10px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
            text-align: left;
        }}
        .info-table td {{
            padding: 12px 10px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
            color: #334155;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            background-color: #fef3c7;
            color: #92400e;
        }}
    </style>
</head>
<body>
    <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        {preview_text}
    </div>
    <div class="email-container">
        <div class="header">
            <h1>SSJEWELLERY</h1>
            <p>ROYAL LUXURY & ELEGANCE</p>
        </div>
        <div class="body-content">
            {content_html}
        </div>
        <div class="footer">
            <p style="margin:0 0 6px 0;"><strong>SSJewellery Official System Notification</strong></p>
            <p style="margin:0 0 6px 0;">For inquiries or assistance, contact <a href="mailto:ssjewellerysystem@gmail.com" style="color:#D4A75F;text-decoration:none;font-weight:bold;">ssjewellerysystem@gmail.com</a></p>
            <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated operational notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>"""


def get_forgot_password_otp_html(name, otp_code):
    """
    Renders HTML email template for Forgot Password OTP.
    """
    customer_greeting = f"Hello {name}," if name else "Hello Customer,"
    content = f"""
    <h2 style="color:#3F1D5A;margin-top:0;">Password Reset Verification</h2>
    <p>{customer_greeting}</p>
    <p>We received a request to reset the password for your SSJewellery account. Please use the following One-Time Password (OTP) to proceed with your password reset:</p>

    <div class="otp-box">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Your Password Reset OTP</div>
        <div class="otp-code">{otp_code}</div>
        <div style="font-size:12px;color:#dc2626;font-weight:bold;margin-top:6px;">⏱ Valid for 5 minutes</div>
    </div>

    <p style="background-color:#fffbeb;border-left:4px solid #D4A75F;padding:12px;font-size:12px;color:#92400e;border-radius:4px;">
        <strong>Security Notice:</strong> Never share this OTP code with anyone. Our support team will never ask for your password or verification code.
    </p>

    <p style="margin-top:20px;font-size:12px;color:#64748b;">If you did not request a password reset, you can safely disregard this email. Your account remains secure.</p>
    """
    return _get_base_template(content, preview_text=f"Your SSJewellery Password Reset OTP: {otp_code}")


def get_order_confirmation_html(name, order):
    """
    Renders HTML email template for Order Confirmation.
    """
    customer_greeting = f"Hello {name}," if name else "Hello Customer,"
    order_id = order.get("order_id") or f"ORD-{order.get('id')}"
    created_at = order.get("created_at") or "Today"
    total_amount = f"₹{float(order.get('total_amount', 0)):,.2f}"
    payment_method = order.get("payment_method") or "Online Payment"
    order_status = order.get("status") or order.get("order_status") or "Confirmed"
    
    # Render items table rows
    items_rows = ""
    items = order.get("items", [])
    for idx, item in enumerate(items):
        item_name = item.get("name") or "Jewellery Item"
        qty = item.get("quantity", 1)
        price = f"₹{float(item.get('price', 0)):,.2f}"
        subtotal = f"₹{float(item.get('price', 0)) * int(qty):,.2f}"
        items_rows += f"""
        <tr>
            <td><strong>{item_name}</strong></td>
            <td style="text-align:center;">{qty}</td>
            <td style="text-align:right;">{price}</td>
            <td style="text-align:right;font-weight:bold;">{subtotal}</td>
        </tr>
        """

    address = order.get("shipping_address", {})
    addr_name = address.get("name") or name or "Valued Customer"
    addr_street = address.get("address") or address.get("street") or ""
    addr_city = address.get("city") or ""
    addr_state = address.get("state") or ""
    addr_pincode = address.get("pincode") or ""
    addr_phone = address.get("phone") or address.get("mobile") or ""

    address_formatted = f"""
    <strong>{addr_name}</strong><br>
    {addr_street}<br>
    {addr_city}, {addr_state} - {addr_pincode}<br>
    <strong>Phone:</strong> {addr_phone}
    """

    content = f"""
    <div style="text-align:center;margin-bottom:20px;">
        <span class="badge" style="background-color:#dcfce7;color:#166534;font-size:12px;padding:6px 16px;">✔ ORDER CONFIRMED</span>
    </div>
    <h2 style="color:#3F1D5A;margin-top:0;text-align:center;">Your Order Has Been Confirmed</h2>
    <p>{customer_greeting}</p>
    <p>Thank you for shopping with SSJewellery! Your order has been successfully placed and is now being processed.</p>

    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;">
        <table style="width:100%;font-size:13px;">
            <tr>
                <td style="color:#64748b;"><strong>Order ID:</strong> {order_id}</td>
                <td style="text-align:right;color:#64748b;"><strong>Date:</strong> {created_at}</td>
            </tr>
            <tr>
                <td style="color:#64748b;"><strong>Status:</strong> {order_status}</td>
                <td style="text-align:right;color:#64748b;"><strong>Payment Method:</strong> {payment_method}</td>
            </tr>
        </table>
    </div>

    <h3 style="color:#3F1D5A;margin-bottom:8px;">Ordered Items</h3>
    <table class="info-table">
        <thead>
            <tr>
                <th>Product</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Total</th>
            </tr>
        </thead>
        <tbody>
            {items_rows}
        </tbody>
    </table>

    <div style="text-align:right;margin:16px 0;font-size:16px;color:#3F1D5A;">
        <strong>Total Amount: <span style="color:#D4A75F;font-size:20px;">{total_amount}</span></strong>
    </div>

    <h3 style="color:#3F1D5A;margin-bottom:8px;">Shipping Address</h3>
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;font-size:13px;color:#334155;">
        {address_formatted}
    </div>

    <p style="margin-top:24px;font-size:13px;color:#475569;">We will notify you once your shipment is dispatched with tracking information.</p>
    """
    return _get_base_template(content, preview_text=f"Your SSJewellery Order {order_id} Has Been Confirmed!")


def get_buy_request_approval_html(name, product_name, request_id, quantity=1, availability_date=None, delivery_date=None, admin_note=None):
    """
    Renders HTML email template for Buy Request Approval / Availability.
    """
    customer_greeting = f"Hello {name}," if name else "Hello Customer,"
    avail_str = availability_date or "Available Now"
    deliv_str = delivery_date or "Standard Delivery"
    note_str = f"<p style='margin-top:8px;font-style:italic;color:#475569;'><strong>Admin Message:</strong> \"{admin_note}\"</p>" if admin_note else ""

    content = f"""
    <div style="text-align:center;margin-bottom:20px;">
        <span class="badge" style="background-color:#dcfce7;color:#166534;font-size:12px;padding:6px 16px;">🌟 REQUEST APPROVED</span>
    </div>
    <h2 style="color:#3F1D5A;margin-top:0;text-align:center;">Your Buy Request Has Been Approved!</h2>
    <p>{customer_greeting}</p>
    <p>Great news! Your requested jewellery item is now confirmed and ready for purchase at SSJewellery.</p>

    <div style="background:#fdfbf7;border:1px solid #D4A75F;border-radius:12px;padding:20px;margin:20px 0;">
        <h3 style="color:#3F1D5A;margin:0 0 12px 0;">Request #{request_id} Details</h3>
        <p style="margin:4px 0;"><strong>Product:</strong> <span style="color:#3F1D5A;font-weight:bold;">{product_name}</span></p>
        <p style="margin:4px 0;"><strong>Quantity:</strong> {quantity}</p>
        <p style="margin:4px 0;"><strong>Expected Availability:</strong> <span style="color:#166534;font-weight:bold;">{avail_str}</span></p>
        <p style="margin:4px 0;"><strong>Expected Delivery:</strong> {deliv_str}</p>
        {note_str}
    </div>

    <div style="text-align:center;margin-top:24px;">
        <p style="font-weight:bold;color:#334155;">Next Steps:</p>
        <p style="font-size:13px;color:#64748b;margin-bottom:16px;">Please log in to your SSJewellery account and visit the <strong>Buy Requests</strong> section in your profile to complete your checkout.</p>
    </div>
    """
    return _get_base_template(content, preview_text=f"Great news! Your Buy Request for {product_name} has been approved.")


def get_registration_otp_html(name, otp_code):
    """
    Renders HTML email template for Registration OTP (Infrastructure ready).
    """
    customer_greeting = f"Hello {name}," if name else "Hello,"
    content = f"""
    <h2 style="color:#3F1D5A;margin-top:0;">Welcome to SSJewellery!</h2>
    <p>{customer_greeting}</p>
    <p>Thank you for creating an account with SSJewellery. Please enter the following One-Time Password (OTP) to complete your account registration:</p>

    <div class="otp-box">
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Your Registration Verification OTP</div>
        <div class="otp-code">{otp_code}</div>
        <div style="font-size:12px;color:#dc2626;font-weight:bold;margin-top:6px;">⏱ Valid for 5 minutes</div>
    </div>

    <p style="font-size:12px;color:#64748b;">If you did not initiate this account creation, please ignore this email.</p>
    """
    return _get_base_template(content, preview_text=f"Welcome to SSJewellery! Your verification OTP: {otp_code}")
