import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

class Config:
    """Base configuration class."""
    # Ensure a strong, random key for production
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default_dev_secret_key_please_change')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/conference_portal')

    if SECRET_KEY == 'default_dev_secret_key_please_change':
        print("WARNING: Using default development SECRET_KEY. Please set a strong SECRET_KEY in your .env file for production.")
    if MONGO_URI == 'mongodb://localhost:27017/conference_portal':
        print("INFO: Using default MongoDB URI. Ensure your MongoDB is running or update MONGO_URI in .env.")

