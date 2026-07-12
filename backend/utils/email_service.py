import os
from dotenv import load_dotenv
from flask import current_app
from flask_mail import Message
from backend.extensions import mail

load_dotenv()

class EmailDeliveryStatus(dict):
    def __bool__(self):
        return bool(self.get("success", False))

def send_email(to_email, subject, body, is_html=False):
    """
    Sends an email using Flask-Mail.
    Returns an EmailDeliveryStatus instance containing success status, configuration details, and errors.
    """
    try:
        # Check if configuration exists
        server = current_app.config.get("MAIL_SERVER")
        port = current_app.config.get("MAIL_PORT")
        username = current_app.config.get("MAIL_USERNAME")
        password = current_app.config.get("MAIL_PASSWORD")
        
        config_info = {
            "smtp_host": server,
            "smtp_port": port,
            "smtp_user": username,
            "gmail_mode": bool(server and "gmail" in server.lower())
        }

        if not (server and port and username and password):
            err_msg = "SMTP configuration is incomplete. Please specify EMAIL_ADDRESS and EMAIL_APP_PASSWORD in .env."
            print(f"[SMTP ERROR] {err_msg}")
            return EmailDeliveryStatus({
                "success": False,
                "status": "failed",
                "configuration": config_info,
                "error": err_msg
            })
            
        # Formulate Message
        msg = Message(
            subject=subject,
            recipients=[to_email]
        )
        if is_html or "<html>" in body:
            msg.html = body
        else:
            msg.body = body
            
        # Send
        mail.send(msg)
        
        print(f"Email successfully sent via Flask-Mail to {to_email}")
        return EmailDeliveryStatus({
            "success": True,
            "status": "delivered",
            "configuration": config_info,
            "error": None
        })
    except Exception as e:
        # Check configuration here to build config_info in case context error or other
        try:
            server = current_app.config.get("MAIL_SERVER")
            port = current_app.config.get("MAIL_PORT")
            username = current_app.config.get("MAIL_USERNAME")
        except Exception:
            server, port, username = None, None, None
            
        config_info = {
            "smtp_host": server,
            "smtp_port": port,
            "smtp_user": username,
            "gmail_mode": bool(server and "gmail" in server.lower())
        }
        error_msg = f"SMTP Transmission Failure: {str(e)}"
        print(f"Error sending email to {to_email}: {error_msg}")
        return EmailDeliveryStatus({
            "success": False,
            "status": "failed",
            "configuration": config_info,
            "error": error_msg
        })

def send_order_confirmation(email, order):
    """
    Formulate order confirmation email template.
    """
    items_html = ""
    for item in order.get("items", []):
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">{item.get('name')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">{item.get('quantity')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹{item.get('price')}</td>
        </tr>
        """
        
    body_html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">SSJewellery Order Confirmed!</h2>
                <p>Hello,</p>
                <p>Thank you for shopping with SSJewellery! Your order has been placed successfully.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                    <p style="margin: 0;"><strong>Order ID:</strong> {order.get('order_id')}</p>
                    <p style="margin: 0;"><strong>Estimated Delivery:</strong> {order.get('delivery_date')}</p>
                    <p style="margin: 0;"><strong>Total Amount Paid:</strong> ₹{order.get('total_amount')}</p>
                </div>
                <h3>Order Items</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="padding: 10px; text-align: left;">Product</th>
                            <th style="padding: 10px; text-align: center;">Qty</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                <h3 style="margin-top: 20px;">Shipping Address</h3>
                <p style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 0;">
                    <strong>{order.get('shipping_address', {}).get('name')}</strong><br>
                    Phone: {order.get('shipping_address', {}).get('phone') or order.get('shipping_address', {}).get('mobile', '')}<br>
                    {order.get('shipping_address', {}).get('address') or order.get('shipping_address', {}).get('street', '')}<br>
                    {order.get('shipping_address', {}).get('city')}, {order.get('shipping_address', {}).get('state')} - {order.get('shipping_address', {}).get('pincode')}
                </p>
                <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                    If you have any questions, contact our support team. This is an automated email, please do not reply.
                </p>
            </div>
        </body>
    </html>
    """
    subject = f"Your SSJewellery Order {order.get('order_id')} is confirmed!"
    return send_email(email, subject, body_html, is_html=True)
