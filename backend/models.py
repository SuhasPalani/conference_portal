from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
import datetime

# Initialize PyMongo, but defer 'db' access
mongo = PyMongo()

class User:
    """
    User model for MongoDB.
    Handles password hashing and verification.
    """
    def __init__(self, full_name, email, password, role='Regular User'):
        self.full_name = full_name
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.role = role # Default role is 'Regular User'

    def save(self):
        """
        Saves the user document to the 'users' collection in MongoDB.
        Checks if a user with the given email already exists.
        Returns the _id of the newly inserted document.
        """
        # Access mongo.db here, within a function that is called after app initialization
        if mongo.db.users.find_one({"email": self.email}):
            raise ValueError("User with this email already exists.")
        
        result = mongo.db.users.insert_one({
            "full_name": self.full_name,
            "email": self.email,
            "password": self.password_hash,
            "role": self.role,
            "created_at": datetime.datetime.utcnow()
        })
        return result.inserted_id

    @staticmethod
    def find_by_email(email):
        """
        Finds a user by their email address.
        Returns the user dictionary or None if not found.
        """
        return mongo.db.users.find_one({"email": email})

    @staticmethod
    def find_by_id(user_id):
        """
        Finds a user by their MongoDB _id.
        Returns the user dictionary or None if not found.
        """
        if not ObjectId.is_valid(user_id):
            return None
        return mongo.db.users.find_one({"_id": ObjectId(user_id)})

    @staticmethod
    def check_password(hashed_password, password):
        """
        Checks if the provided password matches the hashed password.
        """
        return check_password_hash(hashed_password, password)


class BlacklistToken:
    """
    Token Model for storing blacklisted JWT tokens.
    """
    # Remove 'collection = mongo.db.blacklist_tokens' from here.
    # We will access the collection directly in methods.

    def __init__(self, token):
        self.token = token
        self.blacklisted_on = datetime.datetime.utcnow()

    def save(self):
        """Saves the blacklisted token to the database."""
        try:
            # Access mongo.db.blacklist_tokens here, inside a method
            mongo.db.blacklist_tokens.insert_one({
                'token': self.token,
                'blacklisted_on': self.blacklisted_on
            })
            return True
        except Exception as e:
            print(f"Error blacklisting token: {e}")
            return False

    @staticmethod
    def is_blacklisted(token):
        """Checks if a token is blacklisted."""
        # Access mongo.db.blacklist_tokens here, inside a method
        return mongo.db.blacklist_tokens.find_one({'token': token}) is not None