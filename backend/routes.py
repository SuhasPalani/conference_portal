# backend/routes.py
from flask import Blueprint, request, jsonify, redirect, url_for, current_app, g
from models import User, mongo, BlacklistToken # Import mongo for blacklist check
from auth import oauth, handle_oauth_callback, jwt # Import jwt from auth
# Corrected import: add get_jwt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies, get_jwt # <-- ADD THIS IMPORT
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

        if User.find_by_email(email):
            return jsonify({'message': 'User with this email already exists.'}), 409

        new_user = User(full_name, email, password, provider='email') # Specify provider
        user_id = new_user.save() # This also sets new_user._id

        if not user_id:
            current_app.logger.error(f"Failed to save new user for email: {email}")
            return jsonify({'message': 'Failed to create user.'}), 500

        # Generate JWT for the newly registered user
        access_token = create_access_token(identity=new_user.to_dict())
        return jsonify({
            'message': 'User registered successfully!',
            'token': access_token,
            'user': new_user.to_dict()
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

        # Generate JWT for the logged-in user
        access_token = create_access_token(identity=user.to_dict())
        return jsonify({
            'message': 'Logged in successfully!',
            'token': access_token,
            'user': user.to_dict()
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
        'user': user.to_dict(), # Use the to_dict method from the User object
        'conferenceInfo': conference_info
    }), 200

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