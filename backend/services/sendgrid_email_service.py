import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from flask import current_app


def send_sendgrid_email(to_email, subject, html_content):
    """
    Sends an email using SendGrid.
    """
    try:
        api_key = current_app.config.get("SENDGRID_API_KEY")
        sender_email = current_app.config.get("SENDGRID_SENDER_EMAIL")

        if not api_key:
            current_app.logger.error("SendGrid API Key not configured.")
            return {"success": False, "message": "SendGrid API Key not configured."}
        if not sender_email:
            current_app.logger.error("SendGrid Sender Email not configured.")
            return {"success": False, "message": "SendGrid Sender Email not configured."}

        message = Mail(
            from_email=sender_email,
            to_emails=to_email,
            subject=subject,
            html_content=html_content,
        )

        sendgrid_client = SendGridAPIClient(api_key)
        response = sendgrid_client.send(message)

        if 200 <= response.status_code < 300:
            current_app.logger.info(f"SendGrid email sent successfully to {to_email}. Status Code: {response.status_code}")
            return {"success": True, "message": "Email sent successfully via SendGrid."}
        else:
            error_message = f"Failed to send SendGrid email to {to_email}. Status Code: {response.status_code}, Body: {response.body}"
            current_app.logger.error(error_message)
            return {"success": False, "message": f"Failed to send email: {response.status_code}"}

    except Exception as e:
        current_app.logger.error(f"An error occurred while sending SendGrid email: {e}", exc_info=True)
        return {"success": False, "message": f"An error occurred: {str(e)}"}