# backend/config.py
import os
from dotenv import load_dotenv
import datetime

load_dotenv()  # Load environment variables from .env file


class Config:
    SECRET_KEY = (
        os.environ.get("SECRET_KEY") or "your_default_flask_secret_key_if_not_set"
    )
    JWT_SECRET_KEY = (
        os.environ.get("JWT_SECRET_KEY") or "your_default_jwt_secret_key_if_not_set"
    )
    MONGO_URI = (
        os.environ.get("MONGO_URI") or "mongodb://localhost:27017/maiple_conference_db"
    )

    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")

    MICROSOFT_CLIENT_ID = os.environ.get("MICROSOFT_CLIENT_ID")
    MICROSOFT_CLIENT_SECRET = os.environ.get("MICROSOFT_CLIENT_SECRET")
    MICROSOFT_TENANT_ID = os.environ.get("MICROSOFT_TENANT_ID", "common")

    LINKEDIN_CLIENT_ID = os.environ.get("LINKEDIN_CLIENT_ID")
    LINKEDIN_CLIENT_SECRET = os.environ.get("LINKEDIN_CLIENT_SECRET")

    JWT_TOKEN_LOCATION = ["headers"]
    JWT_ACCESS_TOKEN_EXPIRES = datetime.timedelta(hours=24)
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ["access"]
