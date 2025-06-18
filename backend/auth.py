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
    :return: User ID (string) if valid, or a dictionary with error details.
    """
    try:
        if BlacklistToken.is_blacklisted(auth_token):
            current_app.logger.warning("Token provided is blacklisted.")
            return {'success': False, 'message': 'Token blacklisted.'}

        payload = jwt.decode(
            auth_token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        return {'success': True, 'user_id': payload['sub']}
    except jwt.ExpiredSignatureError:
        current_app.logger.warning("Token expired.")
        return {'success': False, 'message': 'Signature expired.'}
    except jwt.InvalidTokenError:
        current_app.logger.warning("Invalid token.")
        return {'success': False, 'message': 'Invalid token.'}
    except Exception as e:
        current_app.logger.error(f"Unexpected error decoding token: {e}")
        return {'success': False, 'message': 'An error occurred during token decoding.'}

def token_required(f):
    """
    Decorator to protect API routes.
    Ensures that a valid JWT token is provided in the 'Authorization' header.
    Attaches the user object to `g.current_user` if successful.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

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

        # Now decode_auth_token returns a dict
        decoded_result = decode_auth_token(token)

        if not decoded_result['success']:
            current_app.logger.error(f"Token validation failed: {decoded_result['message']}")
            return jsonify({'message': decoded_result['message'] + ' Please log in again.'}), 401

        user_id = decoded_result['user_id']

        current_user = User.find_by_id(user_id)
        if not current_user:
            current_app.logger.warning(f"User with ID {user_id} not found after token validation.")
            return jsonify({'message': 'User not found.'}), 401

        g.current_user = current_user

        return f(*args, **kwargs)
    return decorated