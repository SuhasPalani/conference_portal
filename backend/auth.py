import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app, g 
from models import User, BlacklistToken 

def encode_auth_token(user_id):
    """
    Encodes a JWT authentication token.
    :param user_id: The unique identifier of the user (as a string).
    :return: A JWT token string.
    """
    try:
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24), # Token expires in 24 hours
            'iat': datetime.datetime.utcnow(), # Issued at timestamp
            'sub': str(user_id) # Subject (user ID as string)
        }
        return jwt.encode(
            payload,
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )
    except Exception as e:
        current_app.logger.error(f"Error encoding token for user {user_id}: {e}")
        return None

def decode_auth_token(auth_token):
    """
    Decodes the authentication token.
    :param auth_token: The JWT token string.
    :return: User ID (string) if valid, or a string message if invalid/expired/blacklisted.
    """
    try:
        if BlacklistToken.is_blacklisted(auth_token):
            current_app.logger.warning("Token provided is blacklisted.")
            return 'Token blacklisted.' 

        payload = jwt.decode(
            auth_token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        return payload['sub'] 
    except jwt.ExpiredSignatureError:
        current_app.logger.warning("Token expired.")
        return 'Signature expired.'
    except jwt.InvalidTokenError:
        current_app.logger.warning("Invalid token.")
        return 'Invalid token.'
    except Exception as e:
        current_app.logger.error(f"Unexpected error decoding token: {e}")
        return 'An error occurred during token decoding.'

def token_required(f):
    """
    Decorator to protect API routes.
    Ensures that a valid JWT token is provided in the 'Authorization' header.
    Attaches the user object to `g.current_user` if successful.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # OPTIONS requests are explicitly allowed by the route definition
        # (e.g., @main_bp.route('/dashboard', methods=['GET', 'OPTIONS']))
        # The decorator should not try to authenticate them.
        # It also should NOT call the decorated function `f` directly,
        # as that function expects `g.current_user` to be set.
        # Instead, just proceed to the original function for non-OPTIONS,
        # and let Flask-CORS/the route handle the OPTIONS response.
        
        if request.method == 'OPTIONS':
            # For OPTIONS requests, just return without processing token or user
            # Flask-CORS will add the necessary headers automatically.
            return f(*args, **kwargs) # Still call f here so route's OPTIONS handler can execute

        token = None
        if 'Authorization' in request.headers:
            try:
                auth_header = request.headers['Authorization']
                token = auth_header.split(" ")[1]
            except IndexError:
                current_app.logger.warning("Malformed Authorization header.")
                return jsonify({'message': 'Token is missing or malformed!'}), 401

        if not token:
            current_app.logger.warning("Token is missing from Authorization header.")
            return jsonify({'message': 'Token is missing!'}), 401

        user_id_or_message = decode_auth_token(token)

        if user_id_or_message in ['Token blacklisted.', 'Signature expired.', 'Invalid token.', 'An error occurred during token decoding.']:
            current_app.logger.error(f"Token validation failed: {user_id_or_message}")
            return jsonify({'message': user_id_or_message + ' Please log in again.'}), 401

        user_id = user_id_or_message 

        current_user = User.find_by_id(user_id)
        if not current_user:
            current_app.logger.warning(f"User with ID {user_id} not found after token validation.")
            return jsonify({'message': 'User not found.'}), 401
        
        g.current_user = current_user

        return f(*args, **kwargs)
    return decorated