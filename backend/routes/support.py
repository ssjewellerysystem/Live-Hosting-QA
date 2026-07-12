from flask import Blueprint, request, jsonify
from backend.models.support import SupportModel, FAQModel, SupportLinkModel
from backend.middleware.auth import admin_required, token_required

support_bp = Blueprint('support', __name__)

# List of beginner-friendly FAQs for initial seeding
DEFAULT_FAQS = [
    {
        "question": "What is SSJewellery?",
        "answer": "SSJewellery is a premier luxury jewelry store offering masterfully crafted diamond solitaire rings, emerald necklaces, and designer bridal collections."
    },
    {
        "question": "What certifications do you provide?",
        "answer": "All our diamonds are certified by international grading laboratories (such as GIA or IGI), and all gold jewelry carries the official BIS Hallmark certification."
    },
    {
        "question": "Do you offer custom designs?",
        "answer": "Yes, we offer bespoke custom design services. You can contact our support team to schedule a virtual consultation with our lead designers."
    },
    {
        "question": "What is your return policy?",
        "answer": "We offer a 7-day hassle-free return policy on standard catalog items. Custom-designed pieces cannot be returned once production begins."
    },
    {
        "question": "How do I contact support?",
        "answer": "Fill out the contact form on this page or use the live chat assistant widget in the bottom-right corner for quick responses."
    }
]

def ensure_faqs_seeded():
    try:
        faqs = FAQModel.find_all()
        if not faqs:
            for item in DEFAULT_FAQS:
                FAQModel.create_faq(item["question"], item["answer"])
    except Exception as e:
        print("Failed to seed FAQs:", e)

@support_bp.route('', methods=['POST'])
def submit_contact_form():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    message = data.get("message")
    
    if not all([name, email, message]):
        return jsonify({"message": "Please provide your name, email, and message."}), 400
        
    msg = SupportModel.create_message(name, email, message)

    try:
        from backend.models.admin import add_admin_notification
        add_admin_notification(
            title="Support Ticket Created",
            message=f"Ticket #SUP-{msg['id']} submitted by {name}",
            type="SUPPORT_TICKET"
        )
    except Exception as ex:
        print(f"Error adding admin notification: {ex}")

    return jsonify({
        "message": "Thank you! Your support message has been submitted. Our team will contact you shortly.",
        "support_message": msg
    }), 201


@support_bp.route('/<int:ticket_id>/reply', methods=['POST'])
def reply_to_ticket(ticket_id):
    from backend.models.support import SupportModel, SupportReplyModel
    from backend.models.admin import add_admin_notification
    from backend.extensions import db
    
    try:
        ticket = SupportModel.query.with_for_update().get(ticket_id)
        if not ticket:
            return jsonify({"message": "Support ticket not found."}), 404
            
        data = request.get_json() or {}
        sender = data.get("sender") or ticket.name
        message = data.get("message")
        
        if not message:
            return jsonify({"message": "Message is required."}), 400
            
        reply = SupportReplyModel(
            support_id=ticket.id,
            sender=sender,
            message=message
        )
        db.session.add(reply)
        db.session.commit()
        
        # Trigger Admin Notification
        try:
            if sender != "Admin Support" and sender != "Admin":
                add_admin_notification(
                    title="Support Ticket Created",
                    message=f"Ticket #SUP-{ticket.id} submitted by {sender}",
                    type="SUPPORT_TICKET"
                )
        except Exception as ex:
            print("Failed to add admin notification:", ex)
        
        return jsonify({
            "message": "Reply submitted successfully!",
            "reply": reply.to_dict(),
            "success": True
        }), 201
    except Exception as e:
        db.session.rollback()
        print("Failed to save support ticket reply:", e)
        return jsonify({"message": f"Failed to reply: {str(e)}"}), 500

@support_bp.route('/my-tickets', methods=['GET'])
@token_required
def get_my_tickets(current_user):
    email = current_user.get("email")
    if not email:
        return jsonify([]), 200
    
    from sqlalchemy.orm import selectinload
    tickets = SupportModel.query.options(selectinload(SupportModel.replies)).filter(SupportModel.email == email).order_by(SupportModel.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tickets]), 200


@support_bp.route('/all', methods=['GET'])
@admin_required
def get_all_messages():
    messages = SupportModel.find_all()
    return jsonify(messages), 200

@support_bp.route('/faqs', methods=['GET'])
def get_faqs():
    ensure_faqs_seeded()
    faqs = FAQModel.find_all()
    return jsonify([f.to_dict() for f in faqs]), 200

@support_bp.route('/faqs', methods=['POST'])
@admin_required
def add_faq():
    data = request.get_json() or {}
    question = data.get("question")
    answer = data.get("answer")
    if not question or not answer:
        return jsonify({"message": "Question and Answer are required."}), 400
    faq = FAQModel.create_faq(question, answer)
    if faq:
        from backend.utils.audit import log_admin_action
        log_admin_action("Support Ticket Updated", "Support Management", f"Added new FAQ: '{question}'")
        return jsonify(faq), 201
    return jsonify({"message": "Failed to create FAQ."}), 500

@support_bp.route('/faqs/<int:faq_id>', methods=['PUT'])
@admin_required
def update_faq(faq_id):
    data = request.get_json() or {}
    question = data.get("question")
    answer = data.get("answer")
    if not question or not answer:
        return jsonify({"message": "Question and Answer are required."}), 400
    faq = FAQModel.update_faq(faq_id, question, answer)
    if faq:
        from backend.utils.audit import log_admin_action
        log_admin_action("Support Ticket Updated", "Support Management", f"Updated FAQ ID {faq_id}: '{question}'")
        return jsonify(faq), 200
    return jsonify({"message": "FAQ not found or update failed."}), 404

@support_bp.route('/faqs/<int:faq_id>', methods=['DELETE'])
@admin_required
def delete_faq(faq_id):
    success = FAQModel.delete_faq(faq_id)
    if success:
        from backend.utils.audit import log_admin_action
        log_admin_action("Support Ticket Updated", "Support Management", f"Deleted FAQ ID {faq_id}")
        return jsonify({"message": "FAQ deleted successfully."}), 200
    return jsonify({"message": "FAQ not found or delete failed."}), 404

@support_bp.route('/messages/<int:msg_id>/status', methods=['PUT'])
@admin_required
def update_message_status(msg_id):
    from backend.extensions import db
    data = request.get_json() or {}
    status = data.get("status")
    if not status:
        return jsonify({"message": "Status is required."}), 400
        
    try:
        msg = SupportModel.query.with_for_update().get(msg_id)
        if not msg:
            return jsonify({"message": "Message not found."}), 404
            
        old_status = msg.status
        msg.status = status
        db.session.commit()
        
        # Audit Log
        try:
            from backend.utils.audit import log_admin_action
            log_admin_action("Support Ticket Updated", "Support Management", f"Updated support ticket status from '{old_status}' to '{status}' for message from '{msg.name}' (ID: {msg_id})")
        except Exception as ex:
            print("Failed to log admin action:", ex)
        
        return jsonify({"message": "Support message status updated successfully.", "status": status}), 200
    except Exception as e:
        db.session.rollback()
        print("Error updating support message status:", e)
        return jsonify({"message": "An error occurred while updating support message status."}), 500

DEFAULT_SUPPORT_LINKS = [
    {
        "title": "+91 98765 43210",
        "url": "tel:+919876543210",
        "icon": "Phone"
    },
    {
        "title": "support@SSJewellery.com",
        "url": "mailto:support@SSJewellery.com",
        "icon": "Mail"
    },
    {
        "title": "Connaught Place, New Delhi, India",
        "url": "https://maps.google.com/?q=Connaught+Place,+New+Delhi,+India",
        "icon": "MapPin"
    }
]

def ensure_support_links_seeded():
    try:
        links = SupportLinkModel.find_all()
        if not links:
            for item in DEFAULT_SUPPORT_LINKS:
                SupportLinkModel.create_link(item["title"], item["url"], item["icon"])
    except Exception as e:
        print("Failed to seed support links:", e)

@support_bp.route('/links', methods=['GET'])
def get_support_links():
    ensure_support_links_seeded()
    links = SupportLinkModel.find_all()
    return jsonify([link.to_dict() for link in links]), 200

@support_bp.route('/links', methods=['POST'])
@admin_required
def add_support_link():
    data = request.get_json() or {}
    title = data.get("title")
    url = data.get("url")
    icon = data.get("icon", "Phone")
    is_active = data.get("is_active", True)
    if not title or not url:
        return jsonify({"message": "Title and URL are required."}), 400
    link = SupportLinkModel.create_link(title, url, icon, is_active)
    if link:
        from backend.utils.audit import log_admin_action
        log_admin_action("Support Ticket Updated", "Support Management", f"Added new Support Link: '{title}' ({url})")
        return jsonify(link), 201
    return jsonify({"message": "Failed to create support link."}), 500

@support_bp.route('/links/<int:link_id>', methods=['PUT'])
@admin_required
def update_support_link(link_id):
    data = request.get_json() or {}
    title = data.get("title")
    url = data.get("url")
    icon = data.get("icon")
    is_active = data.get("is_active", True)
    if not title or not url or not icon:
        return jsonify({"message": "Title, URL, and Icon are required."}), 400
    link = SupportLinkModel.update_link(link_id, title, url, icon, is_active)
    if link:
        from backend.utils.audit import log_admin_action
        log_admin_action("Support Ticket Updated", "Support Management", f"Updated Support Link ID {link_id}: '{title}'")
        return jsonify(link), 200
    return jsonify({"message": "Support link not found or update failed."}), 404

@support_bp.route('/links/<int:link_id>', methods=['DELETE'])
@admin_required
def delete_support_link(link_id):
    success = SupportLinkModel.delete_link(link_id)
    if success:
        from backend.utils.audit import log_admin_action
        log_admin_action("Support Ticket Updated", "Support Management", f"Deleted Support Link ID {link_id}")
        return jsonify({"message": "Support link deleted successfully."}), 200
    return jsonify({"message": "Support link not found or delete failed."}), 404



