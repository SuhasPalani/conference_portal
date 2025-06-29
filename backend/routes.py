# backend/routes.py
from flask import Blueprint, request, jsonify, redirect, url_for, current_app, g
from models import User, mongo, BlacklistToken
from auth import oauth, handle_oauth_callback
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    unset_jwt_cookies,
    get_jwt,
    decode_token,
    verify_jwt_in_request,  # <--- IMPORT THIS
)
from functools import wraps
import re
from bson.objectid import ObjectId
from config import Config
from email_service import send_email_via_emailjs

api_bp = Blueprint("api", __name__, url_prefix="/api")


# --- Custom Decorators ---
def admin_required():
    """
    Decorator to restrict access to admin users only.
    Handles OPTIONS preflight requests gracefully.
    Assumes JWT identity contains a 'role' field.
    """

    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            # Allow OPTIONS requests to pass through without JWT validation
            if request.method == "OPTIONS":
                return "", 200

            # For other methods, require JWT and check admin role
            try:
                verify_jwt_in_request()  # This will check for a valid JWT
                current_user = get_jwt_identity()
                if current_user.get("role") != "admin":
                    return jsonify({"message": "Admin access required"}), 403
            except Exception as e:
                # Handle JWT errors (e.g., missing token, expired token)
                return jsonify(
                    {"message": str(e), "error_type": "AuthenticationError"}
                ), 401

            return fn(*args, **kwargs)

        return decorator

    return wrapper


# --- Authentication Routes (Email/Password) ---
# (No changes needed here for this specific error)


@api_bp.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({"message": "No JSON data provided!"}), 400

        full_name = data.get("fullName")
        email = data.get("email")
        password = data.get("password")

        if not all([full_name, email, password]):
            return jsonify({"message": "All fields are required!"}), 400

        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({"message": "Invalid email format!"}), 400

        if len(password) < 8:
            return jsonify(
                {"message": "Password must be at least 8 characters long!"}
            ), 400

        existing_user = User.find_by_email(email)
        if existing_user:
            return jsonify({"message": "User with this email already exists."}), 409

        new_user = User(
            full_name, email, password, provider="email", interests=[], status="pending"
        )
        user_id = new_user.save()

        if not user_id:
            current_app.logger.error(f"Failed to save new user for email: {email}")
            return jsonify({"message": "Failed to create user."}), 500

        access_token = create_access_token(identity=new_user.to_dict())
        return jsonify(
            {
                "message": "User registered successfully!",
                "token": access_token,
                "user": new_user.to_dict(),
            }
        ), 201

    except ValueError as e:
        current_app.logger.error(f"Signup validation error: {e}")
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        current_app.logger.error(
            f"Unexpected error during signup for {email if 'email' in locals() else 'unknown'}: {e}",
            exc_info=True,
        )
        return jsonify({"message": "An unexpected error occurred during signup."}), 500


@api_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return "", 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({"message": "No JSON data provided!"}), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email and password are required!"}), 400

        user = User.find_by_email(email)

        if not user or user.provider != "email" or not user.check_password(password):
            return jsonify({"message": "Incorrect email or password."}), 401

        access_token = create_access_token(identity=user.to_dict())
        return jsonify(
            {
                "message": "Logged in successfully!",
                "token": access_token,
                "user": user.to_dict(),
            }
        ), 200

    except Exception as e:
        current_app.logger.error(
            f"Unexpected error during login for {email if 'email' in locals() else 'unknown'}: {e}",
            exc_info=True,
        )
        return jsonify({"message": "An unexpected error occurred during login."}), 500


@api_bp.route("/logout", methods=["POST", "OPTIONS"])
@jwt_required()
def logout():
    if request.method == "OPTIONS":
        return "", 200
    try:
        token_payload = get_jwt()
        jti = token_payload.get(
            "jti"
        )  # Use .get() to avoid KeyError if 'jti' is missing
    except Exception as e:
        current_app.logger.error(
            f"Could not extract JTI for logout: {e}", exc_info=True
        )
        # If JTI can't be extracted, it's effectively a client-side logout
        return jsonify(
            {"message": "Successfully logged out (token could not be blacklisted)."}
        ), 200

    if jti is None:  # Explicitly check if JTI is None
        current_app.logger.warning(
            "Attempted to blacklist a token with a null JTI. Skipping blacklisting."
        )
        return jsonify(
            {"message": "Successfully logged out (no JTI to blacklist)."}
        ), 200

    new_blacklist_token = BlacklistToken(jti)
    if new_blacklist_token.save():
        return jsonify({"message": "Successfully logged out!"}), 200
    else:
        current_app.logger.error(f"Failed to blacklist token JTI: {jti}")
        return jsonify({"message": "Failed to blacklist token."}), 500


@api_bp.route("/dashboard", methods=["GET", "OPTIONS"])
@jwt_required()
def dashboard():
    if request.method == "OPTIONS":
        return "", 200
    current_user_data = get_jwt_identity()
    user_id = current_user_data.get("id")

    user = User.find_by_id(user_id) # Fetch latest user from DB

    if not user:
        return jsonify({"message": "User not found."}), 404

    # Generate a NEW token with the absolute latest user data from DB
    latest_access_token = create_access_token(identity=user.to_dict())

    conference_info = {
        "title": "mAIple Global AI Conference 2025",
        "date": "October 26-28, 2025",
        "location": "Virtual & Chicago, IL",
        "description": "Explore the cutting edge of Artificial Intelligence. Featuring leading experts, groundbreaking research, and interactive workshops.",
        "tracks": [
            "Generative AI & LLMs",
            "AI Ethics & Governance",
            "AI in Healthcare",
            "Robotics & Automation",
            "Computer Vision",
            "Natural Language Processing",
        ],
        "participationTimelines": "Early Bird Registration ends August 15, 2025. Speaker applications close July 30, 2025.",
    }

    return jsonify(
        {
            "message": f"Welcome to your dashboard, {user.full_name}!",
            "user": user.to_dict(),
            "conferenceInfo": conference_info,
            "token": latest_access_token # <--- Return the new token here
        }
    ), 200


@api_bp.route(
    "/users/<user_id>/interests", methods=["PUT", "OPTIONS"]
)  # <-- ADDED OPTIONS
@jwt_required()
def update_user_interests(user_id):
    if request.method == "OPTIONS":
        return "", 200  # <-- ADDED
    current_user_jwt_identity = get_jwt_identity()
    current_user_id_from_jwt = current_user_jwt_identity.get("id")
    current_user_role_from_jwt = current_user_jwt_identity.get("role")

    if (
        str(current_user_id_from_jwt) != user_id
        and current_user_role_from_jwt != "admin"
    ):
        return jsonify(
            {"message": "Forbidden: You can only update your own interests."}
        ), 403

    data = request.get_json()
    interests = data.get("interests")

    if not isinstance(interests, list):
        return jsonify({"message": 'Invalid data: "interests" must be a list.'}), 400
    if not all(isinstance(item, str) for item in interests):
        return jsonify(
            {"message": 'Invalid data: All items in "interests" must be strings.'}
        ), 400

    try:
        user_to_update = User.find_by_id(user_id)
        if not user_to_update:
            return jsonify({"message": "User not found."}), 404

        user_to_update.interests = interests
        user_to_update.save()

        new_token = create_access_token(identity=user_to_update.to_dict())

        return jsonify(
            {
                "success": True,
                "message": "Interests updated successfully!",
                "user": user_to_update.to_dict(),
                "token": new_token,
            }
        ), 200
    except Exception as e:
        current_app.logger.error(
            f"Error updating user interests for {user_id}: {e}", exc_info=True
        )
        return jsonify(
            {"message": "An error occurred while updating interests.", "error": str(e)}
        ), 500


# --- NEW ADMIN ROUTES ---
@api_bp.route("/admin/users", methods=["GET", "OPTIONS"])
@admin_required()  # This decorator now handles OPTIONS internally
def get_all_users():
    # The OPTIONS check is now inside the admin_required decorator
    try:
        users = User.get_all_users()
        users_data = [user.to_dict() for user in users]
        return jsonify({"success": True, "users": users_data}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching all users: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Failed to fetch users."}), 500


@api_bp.route("/admin/users/<user_id>/status", methods=["PUT", "OPTIONS"])
@admin_required()  # This decorator now handles OPTIONS internally
def update_user_status(user_id):
    # The OPTIONS check is now inside the admin_required decorator
    try:
        if not ObjectId.is_valid(user_id):
            return jsonify(
                {"success": False, "message": "Invalid user ID format."}
            ), 400

        data = request.get_json()
        new_role = data.get("role")
        new_status = data.get("status")

        if not new_role or not new_status:
            return jsonify(
                {"success": False, "message": "New role and status are required."}
            ), 400

        user_to_update = User.find_by_id(user_id)
        if not user_to_update:
            return jsonify({"success": False, "message": "User not found."}), 404

        old_role = user_to_update.role
        old_status = user_to_update.status

        # Update the user object
        user_to_update.role = new_role
        user_to_update.status = new_status
        user_to_update.save()  # Save changes to the database

        # Generate a NEW token for the user whose status was updated
        # This new token will contain the updated role and status
        new_access_token_for_user = create_access_token(
            identity=user_to_update.to_dict()
        )

        if old_role != new_role or old_status != new_status:
            template_params = {
                "user_name": user_to_update.full_name,
                "user_email": user_to_update.email,  # Note: this is sent but not used in template content
                "old_role": old_role,
                "new_role": new_role,
                "old_status": old_status,
                "new_status": new_status,
                "dashboard_url": Config.FRONTEND_URL + "/dashboard",
                "title": "Role Assignment Update",
            }
            email_result = send_email_via_emailjs(
                Config.EMAILJS_TEMPLATE_ROLE_ASSIGNED_ID,
                template_params,
                user_to_update.email,
            )
            if not email_result["success"]:
                current_app.logger.warning(
                    f"Failed to send role/status update email to {user_to_update.email}: {email_result['message']}"
                )

        return jsonify(
            {
                "success": True,
                "message": "User role and status updated successfully.",
                "user": user_to_update.to_dict(),
                "token": new_access_token_for_user,  # <-- Now includes the new token
            }
        ), 200

    except Exception as e:
        current_app.logger.error(
            f"Error updating user role/status for {user_id}: {e}", exc_info=True
        )
        return jsonify(
            {
                "success": False,
                "message": "An error occurred while updating role and status.",
            }
        ), 500


# --- NEW CONTACT FORM ROUTE ---
@api_bp.route("/contact", methods=["POST", "OPTIONS"])
def contact_form_submit():
    if request.method == "OPTIONS":
        return "", 200  # <-- ADDED
    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        subject = data.get("subject")
        message = data.get("message")

        if not all([name, email, subject, message]):
            return jsonify(
                {"success": False, "message": "All fields are required."}
            ), 400

        template_params = {
            "from_name": name,
            "from_email": email,
            "subject": subject,
            "message": message,
            "to_name": "mAIple Support Team",
            "title": "New Contact Message",  # Add this line, or whatever dynamic title you want
        }

        email_result = send_email_via_emailjs(
            Config.EMAILJS_TEMPLATE_CONTACT_US_ID, template_params, Config.ADMIN_EMAIL
        )

        if email_result["success"]:
            return jsonify(
                {"success": True, "message": "Your message has been sent successfully!"}
            ), 200
        else:
            return jsonify(
                {
                    "success": False,
                    "message": email_result["message"] or "Failed to send message.",
                }
            ), 500

    except Exception as e:
        current_app.logger.error(
            f"Error processing contact form submission: {e}", exc_info=True
        )
        return jsonify(
            {
                "success": False,
                "message": "An unexpected error occurred while sending your message.",
            }
        ), 500


# --- OAuth Routes ---
@api_bp.route("/auth/google", methods=["GET"])
def google_auth():
    redirect_uri = url_for("api.google_callback", _external=True)
    return oauth.google.authorize_redirect(redirect_uri)


@api_bp.route("/auth/google/callback", methods=["GET"])
def google_callback():
    return handle_oauth_callback("google", oauth.google)


@api_bp.route("/auth/microsoft", methods=["GET"])
def microsoft_auth():
    redirect_uri = url_for("api.microsoft_callback", _external=True)
    return oauth.microsoft.authorize_redirect(redirect_uri)


@api_bp.route("/auth/microsoft/callback", methods=["GET"])
def microsoft_callback():
    return handle_oauth_callback("microsoft", oauth.microsoft)


@api_bp.route("/auth/linkedin", methods=["GET"])
def linkedin_auth():
    redirect_uri = url_for("api.linkedin_callback", _external=True)
    return oauth.linkedin.authorize_redirect(redirect_uri)


@api_bp.route("/auth/linkedin/callback", methods=["GET"])
def linkedin_callback():
    return handle_oauth_callback("linkedin", oauth.linkedin)
