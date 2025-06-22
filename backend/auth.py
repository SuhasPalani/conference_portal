# backend/auth.py
from flask import redirect, url_for, session, current_app, request, jsonify
from authlib.integrations.flask_client import OAuth

# Corrected import for JWTManager and its components
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    decode_token as decode_jwt_token,
    unset_jwt_cookies,
)
from models import User, BlacklistToken, mongo
from config import Config
import requests
from bson import ObjectId  # Import ObjectId for MongoDB document IDs
import os

oauth = OAuth()
jwt = JWTManager()


def configure_auth(app):
    """Initializes Authlib and Flask-JWT-Extended with the Flask app."""
    jwt.init_app(app)
    oauth.init_app(app)

    # JWT Callbacks for user identity lookup and token blacklisting

    # This callback is used by get_current_user (if you map it) or when you need to load the user from DB
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        # jwt_data['sub'] is the identity you passed during create_access_token
        # It's a dictionary like {'id': '...', 'full_name': '...', 'email': '...'}
        user_id = jwt_data["sub"].get("id")
        if not user_id:
            current_app.logger.error("JWT payload 'sub.id' is missing for user lookup.")
            return None  # Or raise an exception if this should be a critical error
        try:
            # Ensure the ID is an ObjectId if your find_by_id expects it
            return User.find_by_id(user_id)
        except Exception as e:
            current_app.logger.error(
                f"Error looking up user by ID {user_id}: {e}", exc_info=True
            )
            return None

    # This is the correct callback for handling token blacklisting/revocation
    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        # This function should return True if the token is blacklisted, False otherwise.
        is_blocked = BlacklistToken.is_blacklisted(jti)
        # current_app.logger.debug(f"JTI {jti} is blacklisted: {is_blocked}") # Optional: for debugging
        return is_blocked

    # Google OAuth Configuration
    oauth.register(
        name="google",
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        access_token_url="https://accounts.google.com/o/oauth2/token",
        access_token_params=None,
        authorize_url="https://accounts.google.com/o/oauth2/auth",
        authorize_params=None,
        api_base_url="https://www.googleapis.com/oauth2/v1/",
        client_kwargs={"scope": "openid email profile"},
        jwks_uri="https://www.googleapis.com/oauth2/v3/certs",
    )

    # Microsoft OAuth (Azure AD) Configuration
    microsoft_authorize_url = f"https://login.microsoftonline.com/{Config.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize"
    microsoft_token_url = f"https://login.microsoftonline.com/{Config.MICROSOFT_TENANT_ID}/oauth2/v2.0/token"
    microsoft_api_base_url = "https://graph.microsoft.com/v1.0/"

    oauth.register(
        name="microsoft",
        client_id=Config.MICROSOFT_CLIENT_ID,
        client_secret=Config.MICROSOFT_CLIENT_SECRET,
        access_token_url=microsoft_token_url,
        authorize_url=microsoft_authorize_url,
        api_base_url=microsoft_api_base_url,
        client_kwargs={
            "scope": "openid email profile User.Read",
            "response_type": "code",
        },
    )

    # LinkedIn OAuth Configuration - FIXED for nonce issue
    oauth.register(
        name="linkedin",
        client_id=Config.LINKEDIN_CLIENT_ID,
        client_secret=Config.LINKEDIN_CLIENT_SECRET,
        access_token_url="https://www.linkedin.com/oauth/v2/accessToken",
        authorize_url="https://www.linkedin.com/oauth/v2/authorization",
        api_base_url="https://api.linkedin.com/v2/",
        client_kwargs={
            "scope": "r_liteprofile r_emailaddress",  # Using traditional LinkedIn scopes
            "token_endpoint_auth_method": "client_secret_post",
        },
        # Removed server_metadata_url to avoid OpenID Connect nonce issues
    )


def linkedin_fetch_userinfo(token):
    """
    Fetch user info from LinkedIn using traditional API endpoints.
    This is the most reliable method for LinkedIn OAuth.
    """
    headers = {"Authorization": f"Bearer {token['access_token']}"}

    try:
        # Get basic profile info
        profile_resp = requests.get(
            "https://api.linkedin.com/v2/people/~:(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))",
            headers=headers
        )
        profile_resp.raise_for_status()
        profile_data = profile_resp.json()

        # Get email info
        email_resp = requests.get(
            "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
            headers=headers,
        )
        email_resp.raise_for_status()
        email_data = email_resp.json()

        # Extract email from the complex response structure
        email = None
        if email_data.get("elements") and len(email_data["elements"]) > 0:
            email_element = email_data["elements"][0]
            if "handle~" in email_element:
                email = email_element["handle~"].get("emailAddress")

        # Extract name information
        first_name = profile_data.get("localizedFirstName", "")
        last_name = profile_data.get("localizedLastName", "")
        full_name = f"{first_name} {last_name}".strip()

        # Extract profile picture
        picture_url = None
        if "profilePicture" in profile_data:
            display_image = profile_data["profilePicture"].get("displayImage~")
            if display_image and "elements" in display_image:
                elements = display_image["elements"]
                if elements:
                    # Get the largest image
                    largest_image = max(elements, key=lambda x: x.get("data", {}).get("com.linkedin.digitalmedia.mediaartifact.StillImage", {}).get("storageSize", {}).get("width", 0))
                    identifiers = largest_image.get("identifiers", [])
                    if identifiers:
                        picture_url = identifiers[0].get("identifier")

        user_info = {
            "id": profile_data.get("id"),
            "name": full_name,
            "email": email,
            "given_name": first_name,
            "family_name": last_name,
            "picture": picture_url,
            "email_verified": True,  # LinkedIn emails are generally verified
        }

        return user_info

    except Exception as e:
        current_app.logger.error(f"LinkedIn user info fetch failed: {e}")
        # Fallback to basic info if detailed fetch fails
        try:
            # Simplified fallback
            profile_resp = requests.get(
                "https://api.linkedin.com/v2/people/~",
                headers=headers
            )
            profile_resp.raise_for_status()
            profile_data = profile_resp.json()
            
            email_resp = requests.get(
                "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
                headers=headers,
            )
            email_resp.raise_for_status()
            email_data = email_resp.json()
            
            email = None
            if email_data.get("elements") and len(email_data["elements"]) > 0:
                email_element = email_data["elements"][0]
                if "handle~" in email_element:
                    email = email_element["handle~"].get("emailAddress")
            
            first_name = profile_data.get("localizedFirstName", "")
            last_name = profile_data.get("localizedLastName", "")
            full_name = f"{first_name} {last_name}".strip()
            
            return {
                "id": profile_data.get("id"),
                "name": full_name,
                "email": email,
                "given_name": first_name,
                "family_name": last_name,
            }
            
        except Exception as fallback_error:
            current_app.logger.error(f"LinkedIn fallback also failed: {fallback_error}")
            raise


def linkedin_fetch_userinfo_fallback(token):
    """Fallback method using traditional LinkedIn API endpoints."""
    return linkedin_fetch_userinfo(token)  # Same implementation now


def handle_oauth_callback(provider_name, remote_app):
    """
    Handles the OAuth callback for a given provider.
    Exchanges authorization code for token, fetches user info,
    creates/updates user in DB, and generates JWT.
    """
    try:
        # Get the OAuth token (access token from provider)
        token = remote_app.authorize_access_token()
        if not token:
            current_app.logger.error(f"{provider_name} OAuth: No token received.")
            return redirect(
                f"{Config.FRONTEND_URL}/login?error={provider_name}AuthFailed"
            )

        # Fetch user info using the provider's API
        user_info = None
        if provider_name == "google":
            resp = remote_app.get("userinfo", token=token)
            user_info = resp.json()
            email = user_info.get("email")
            full_name = user_info.get("name", email)
            provider_id = user_info.get("id")
            
        elif provider_name == "microsoft":
            resp = remote_app.get("me", token=token)
            user_info = resp.json()
            email = user_info.get("mail") or user_info.get("userPrincipalName")
            full_name = user_info.get("displayName", email)
            provider_id = user_info.get("id")
            
        elif provider_name == "linkedin":
            # Use the traditional LinkedIn API
            user_info = linkedin_fetch_userinfo(token)
            email = user_info.get("email")
            full_name = user_info.get("name", email)
            provider_id = user_info.get("id")

        else:
            current_app.logger.error(f"Unknown OAuth provider: {provider_name}")
            return redirect(f"{Config.FRONTEND_URL}/login?error=UnknownProvider")

        if not email:
            current_app.logger.warning(
                f"{provider_name} OAuth: No email found in user info."
            )
            return redirect(
                f"{Config.FRONTEND_URL}/login?error={provider_name}AuthNoEmail"
            )
        if not provider_id:
            current_app.logger.warning(
                f"{provider_name} OAuth: No provider ID found in user info."
            )
            return redirect(
                f"{Config.FRONTEND_URL}/login?error={provider_name}AuthNoId"
            )

        # Check if user exists by provider_id
        user = User.find_by_provider(provider_name, provider_id)
        if user:
            # User exists via this provider, update their info if necessary
            user.full_name = full_name
            user.email = email
            user.save()  # Updates existing document
            current_app.logger.info(
                f"Existing user '{email}' logged in via {provider_name}."
            )
        else:
            # Check if email is already registered via email/password or another OAuth provider
            existing_email_user = User.find_by_email(email)
            if existing_email_user:
                # If email exists but with a different provider/method, block it
                current_app.logger.warning(
                    f"Email '{email}' already registered with '{existing_email_user.provider}'."
                )
                return redirect(
                    f"{Config.FRONTEND_URL}/login?error=EmailAlreadyUsedByOtherProvider"
                )

            # New user, create in DB
            new_user = User(
                full_name=full_name,
                email=email,
                provider=provider_name,
                provider_id=provider_id,
            )
            new_user.save()  # Inserts new document, sets new_user._id
            user = new_user  # Set user to the newly created user object
            current_app.logger.info(
                f"New user '{email}' registered via {provider_name}."
            )

        # Generate JWT for the user
        # create_access_token takes the identity of the user, which can be a dictionary
        access_token = create_access_token(identity=user.to_dict())

        # Redirect to frontend with token and user info in query parameters
        return redirect(
            f"{Config.FRONTEND_URL}/login?"
            f"token={access_token}&"
            f"fullName={full_name}&"
            f"email={email}&"
            f"provider={provider_name}"
        )

    except Exception as e:
        current_app.logger.error(
            f"Error during {provider_name} OAuth callback: {e}", exc_info=True
        )
        return redirect(f"{Config.FRONTEND_URL}/login?error={provider_name}AuthFailed")