# backend/routes.py
from flask import Blueprint, request, jsonify, redirect, url_for, current_app, g
from models import User, mongo, BlacklistToken # Import mongo for blacklist check
from auth import oauth, handle_oauth_callback # Removed direct jwt import from auth; using flask_jwt_extended directly
# Corrected import: ensure all necessary Flask-JWT-Extended functions are imported
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    unset_jwt_cookies,
    get_jwt, # <-- KEEP THIS IMPORT
    decode_token # Added decode_token
)
import re
from bson.objectid import ObjectId

api_bp = Blueprint('api', __name__, url_prefix='/api')

# --- Authentication Routes (Email/Password) ---
@api_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No JSON data provided!'}), 400

        full_name = data.get('fullName') # Frontend sends fullName
        email = data.get('email')
        password = data.get('password')

        if not all([full_name, email, password]):
            return jsonify({'message': 'All fields are required!'}), 400

        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({'message': 'Invalid email format!'}), 400

        if len(password) < 8:
            return jsonify({'message': 'Password must be at least 8 characters long!'}), 400

        # Check for existing user by email
        existing_user = User.find_by_email(email)
        if existing_user:
            return jsonify({'message': 'User with this email already exists.'}), 409

        # When registering, interests can be an empty list initially
        new_user = User(full_name, email, password, provider='email', interests=[])
        user_id = new_user.save() # This also sets new_user._id

        if not user_id:
            current_app.logger.error(f"Failed to save new user for email: {email}")
            return jsonify({'message': 'Failed to create user.'}), 500

        # Generate JWT for the newly registered user (to_dict includes interests)
        access_token = create_access_token(identity=new_user.to_dict())
        return jsonify({
            'message': 'User registered successfully!',
            'token': access_token,
            'user': new_user.to_dict() # This now includes the 'interests' field
        }), 201

    except ValueError as e:
        current_app.logger.error(f"Signup validation error: {e}")
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Unexpected error during signup for {email if 'email' in locals() else 'unknown'}: {e}", exc_info=True)
        return jsonify({'message': 'An unexpected error occurred during signup.'}), 500

@api_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No JSON data provided!'}), 400

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Email and password are required!'}), 400

        user = User.find_by_email(email)

        # Check if user exists and if it's an email/password user
        if not user or user.provider != 'email' or not user.check_password(password):
            return jsonify({'message': 'Incorrect email or password.'}), 401

        # Generate JWT for the logged-in user (to_dict includes interests)
        access_token = create_access_token(identity=user.to_dict())
        return jsonify({
            'message': 'Logged in successfully!',
            'token': access_token,
            'user': user.to_dict() # This now includes the 'interests' field
        }), 200

    except Exception as e:
        current_app.logger.error(f"Unexpected error during login for {email if 'email' in locals() else 'unknown'}: {e}", exc_info=True)
        return jsonify({'message': 'An unexpected error occurred during login.'}), 500

@api_bp.route('/logout', methods=['POST', 'OPTIONS'])
@jwt_required() # Protect this route with Flask-JWT-Extended
def logout():
    """
    Handles user logout by blacklisting the provided JWT token's JTI.
    Requires a valid JWT token in the Authorization header.
    """
    if request.method == 'OPTIONS':
        return '', 200

    try:
        token_payload = get_jwt() # Get the entire payload
        jti = token_payload["jti"]
    except Exception as e:
        current_app.logger.error(f"Could not extract JTI for logout: {e}", exc_info=True)
        return jsonify({'message': 'Could not process logout. Invalid token.'}), 400

    new_blacklist_token = BlacklistToken(jti) # Blacklist the JTI
    if new_blacklist_token.save():
        return jsonify({'message': 'Successfully logged out.'}), 200
    else:
        current_app.logger.error(f"Failed to blacklist token JTI: {jti}")
        return jsonify({'message': 'Failed to blacklist token.'}), 500

@api_bp.route('/dashboard', methods=['GET', 'OPTIONS'])
@jwt_required() # Protect this route with Flask-JWT-Extended
def dashboard():
    """
    Protected endpoint for the user dashboard.
    Requires a valid JWT token.
    """
    if request.method == 'OPTIONS':
        return '', 200

    # get_jwt_identity() will return the dictionary we passed as identity when creating the token
    current_user_data = get_jwt_identity()
    user_id = current_user_data.get('id')

    user = User.find_by_id(user_id) # Fetch full user object from DB if needed, or rely on JWT data

    if not user:
        return jsonify({'message': 'User not found.'}), 404

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

    return jsonify({
        'message': f"Welcome to your dashboard, {user.full_name}!",
        'user': user.to_dict(), # This now includes the 'interests' field
        'conferenceInfo': conference_info
    }), 200

# --- NEW: Route to update user interests ---
@api_bp.route('/users/<user_id>/interests', methods=['PUT'])
@jwt_required() # Protect this route with JWT authentication
def update_user_interests(user_id):
    """
    Updates the interests of a user.
    """
    if request.method == 'OPTIONS':
        return '', 200

    current_user_jwt_identity = get_jwt_identity()
    current_user_id_from_jwt = current_user_jwt_identity.get('id')
    current_user_role_from_jwt = current_user_jwt_identity.get('role')

    # Authorization check: Ensure the authenticated user is updating their own profile
    # or an admin is updating someone else's.
    if str(current_user_id_from_jwt) != user_id and current_user_role_from_jwt != 'admin':
        return jsonify({'message': 'Forbidden: You can only update your own interests.'}), 403

    data = request.get_json()
    interests = data.get('interests')

    # Input validation
    if not isinstance(interests, list):
        return jsonify({'message': 'Invalid data: "interests" must be a list.'}), 400
    if not all(isinstance(item, str) for item in interests):
        return jsonify({'message': 'Invalid data: All items in "interests" must be strings.'}), 400

    try:
        user_to_update = User.find_by_id(user_id)
        if not user_to_update:
            return jsonify({'message': 'User not found.'}), 404

        user_to_update.interests = interests # Update the interests field
        # Use save() which updates the document if _id exists
        user_to_update.save()

        # Generate a new token with the updated interests
        new_token = create_access_token(identity=user_to_update.to_dict())

        return jsonify({
            'success': True,
            'message': 'Interests updated successfully!',
            'user': user_to_update.to_dict(), # Return the updated user object
            'token': new_token # Return the new token
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error updating user interests for {user_id}: {e}", exc_info=True)
        return jsonify({'message': 'An error occurred while updating interests.', 'error': str(e)}), 500

# --- OAuth Routes ---
@api_bp.route('/auth/google', methods=['GET'])
def google_auth():
    redirect_uri = url_for('api.google_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@api_bp.route('/auth/google/callback', methods=['GET'])
def google_callback():
    return handle_oauth_callback('google', oauth.google)

@api_bp.route('/auth/microsoft', methods=['GET'])
def microsoft_auth():
    redirect_uri = url_for('api.microsoft_callback', _external=True)
    return oauth.microsoft.authorize_redirect(redirect_uri)

@api_bp.route('/auth/microsoft/callback', methods=['GET'])
def microsoft_callback():
    return handle_oauth_callback('microsoft', oauth.microsoft)

@api_bp.route('/auth/linkedin', methods=['GET'])
def linkedin_auth():
    redirect_uri = url_for('api.linkedin_callback', _external=True)
    return oauth.linkedin.authorize_redirect(redirect_uri)

@api_bp.route('/auth/linkedin/callback', methods=['GET'])
def linkedin_callback():
    return handle_oauth_callback('linkedin', oauth.linkedin)