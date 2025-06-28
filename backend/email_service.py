# backend/email_service.py
import requests
from flask import current_app


def send_email_via_emailjs(template_id, template_params, to_email):
    """
    Sends an email using EmailJS service via a server-side proxy POST request.
    This is for cases where you might want to hide EmailJS private key or use it
    for sensitive notifications.

    For basic contact forms, EmailJS often uses client-side direct calls,
    but for backend-triggered notifications (like role changes), a server-side
    call is more appropriate and secure if using a private key.

    EmailJS's typical server-side API involves a POST request to:
    https://api.emailjs.com/api/v1.0/email/send

    Template parameters need to match what you define in EmailJS template.
    """
    service_id = current_app.config.get("EMAILJS_SERVICE_ID")
    private_key = current_app.config.get(
        "EMAILJS_PRIVATE_KEY"
    )  # Use private key for server-side
    public_key = current_app.config.get("EMAILJS_PUBLIC_KEY")  # Also sometimes required

    if not service_id or not private_key:
        current_app.logger.error("EmailJS service ID or private key not configured.")
        return {"success": False, "message": "Email service not configured."}

    url = "https://api.emailjs.com/api/v1.0/email/send"
    headers = {"Content-Type": "application/json"}
    data = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": public_key,  # EmailJS requires public key as user_id for API calls
        "private_key": private_key,  # This is the crucial part for server-side security
        "template_params": template_params,
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
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
