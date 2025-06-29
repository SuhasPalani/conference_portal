# backend/email_service.py
import requests
from flask import current_app


def send_email_via_emailjs(template_id, template_params, to_email):
    """
    Sends an email using EmailJS service via a server-side POST request.

    EmailJS's server-side API expects:
    - service_id
    - template_id
    - user_id (this is the public key)
    - template_params

    NOTE: 'private_key' is not used in this endpoint and should NOT be passed.
    """
    service_id = current_app.config.get("EMAILJS_SERVICE_ID")
    public_key = current_app.config.get("EMAILJS_PUBLIC_KEY")  # Required as user_id

    if not service_id or not public_key:
        current_app.logger.error("EmailJS service ID or public key not configured.")
        return {"success": False, "message": "Email service not configured properly."}

    url = "https://api.emailjs.com/api/v1.0/email/send"
    headers = {"Content-Type": "application/json"}
    data = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": public_key,  # Required
        "template_params": {**template_params, "to_email": to_email},
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        current_app.logger.info(
            f"Email sent successfully via EmailJS to {to_email} with template {template_id}."
        )
        return {"success": True, "message": "Email sent successfully!"}
    except requests.exceptions.RequestException as e:
        current_app.logger.error(
            f"Error sending email via EmailJS: {e}, Response: {getattr(e.response, 'text', 'N/A')}"
        )
        return {"success": False, "message": f"Failed to send email: {e}"}
    except Exception as e:
        current_app.logger.error(
            f"An unexpected error occurred while sending email: {e}"
        )
        return {
            "success": False,
            "message": "An unexpected error occurred during email sending.",
        }
