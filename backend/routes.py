from flask import Blueprint, request, jsonify, current_app, g # Import g
from models import User, mongo, BlacklistToken # Import BlacklistToken
from auth import encode_auth_token, token_required, decode_auth_token # Make sure decode_auth_token is imported for dashboard
import re
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__)
main_bp = Blueprint('main', __name__)

@auth_bp.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No JSON data provided!'}), 400
            
        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password')

        if not full_name or not email or not password:
            return jsonify({'message': 'All fields are required!'}), 400
        
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({'message': 'Invalid email format!'}), 400

        if len(password) < 8:
            return jsonify({'message': 'Password must be at least 8 characters long!'}), 400

        if User.find_by_email(email):
            return jsonify({'message': 'User with this email already exists.'}), 409

        new_user = User(full_name, email, password)
        user_id = new_user.save()
        
        if not user_id:
            return jsonify({'message': 'Failed to create user.'}), 500

        auth_token = encode_auth_token(str(user_id))
        if auth_token:
            return jsonify({
                'message': 'User registered successfully!',
                'token': auth_token
            }), 201
        else:
            current_app.logger.error(f"Failed to generate token for new user {email}")
            return jsonify({'message': 'Failed to generate authentication token.'}), 500

    except ValueError as e:
        current_app.logger.error(f"Signup validation error: {e}")
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Unexpected error during signup for {email if 'email' in locals() else 'unknown'}: {e}")
        return jsonify({'message': 'An unexpected error occurred during signup.'}), 500

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
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

        if user and User.check_password(user['password'], password):
            auth_token = encode_auth_token(str(user['_id']))
            if auth_token:
                return jsonify({
                    'message': 'Logged in successfully!',
                    'token': auth_token,
                    'user': {
                        'id': str(user['_id']),
                        'full_name': user['full_name'],
                        'email': user['email'],
                        'role': user['role']
                    }
                }), 200
            else:
                current_app.logger.error(f"Failed to generate token for existing user {email}")
                return jsonify({'message': 'Failed to generate authentication token.'}), 500
        else:
            return jsonify({'message': 'Incorrect email or password.'}), 401
            
    except Exception as e:
        current_app.logger.error(f"Unexpected error during login: {e}")
        return jsonify({'message': 'An unexpected error occurred during login.'}), 500

@auth_bp.route('/logout', methods=['POST', 'OPTIONS'])
@token_required # Use the decorator to ensure a valid token is provided
def logout():
    """
    Handles user logout by blacklisting the provided JWT token.
    Requires a valid JWT token in the Authorization header.
    """
    if request.method == 'OPTIONS':
        return '', 200

    auth_header = request.headers.get('Authorization')
    if not auth_header:
        # This case should ideally be caught by token_required, but good to have a fallback
        return jsonify({'message': 'Authorization header is missing!'}), 401
    
    try:
        token = auth_header.split(' ')[1] # Expected format: 'Bearer <token>'
    except IndexError:
        return jsonify({'message': 'Invalid Authorization header format!'}), 401

    # The token_required decorator already handled token validation and put user in g.current_user.
    # We just need to blacklist the token that was just used.
    if BlacklistToken.is_blacklisted(token):
        return jsonify({'message': 'Token already blacklisted.'}), 200 # Idempotent logout
    
    new_blacklist_token = BlacklistToken(token)
    if new_blacklist_token.save():
        return jsonify({'message': 'Successfully logged out.'}), 200
    else:
        current_app.logger.error(f"Failed to blacklist token: {token}")
        return jsonify({'message': 'Failed to blacklist token.'}), 500

@main_bp.route('/dashboard', methods=['GET', 'OPTIONS'])
@token_required 
def dashboard():
    """
    Protected endpoint for the user dashboard.
    Requires a valid JWT token.
    """
    if request.method == 'OPTIONS':
        # Flask-CORS will add the necessary headers.
        # This branch correctly returns without accessing g.current_user.
        return '', 200 
    
    # For GET requests, if we reach here, token_required has guaranteed 
    # g.current_user is set because it only allows non-OPTIONS requests
    # to proceed after successful authentication.
    user = g.current_user 

    return jsonify({
        'message': f'Welcome to your dashboard, {user["full_name"]}!',
        'user': {
            'id': str(user['_id']),
            'full_name': user['full_name'],
            'email': user['email'],
            'role': user['role']
        },
        'conferenceInfo': {
            'title': 'AI Conference 2025: Shaping the Future',
            'date': 'October 26-28, 2025',
            'location': 'Virtual & Chicago, IL',
            'description': 'Join leading experts in Artificial Intelligence to explore the latest advancements, research, and applications across various domains.',
            'tracks': ['Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 'AI Ethics'],
            'participationTimelines': 'Registration: Sep 1 - Oct 15 | Abstract Submission: Jul 1 - Aug 31 | Speaker Announcements: Sep 20'
        }
    }), 200
