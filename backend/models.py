# backend/models.py
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
import datetime

# Initialize PyMongo outside the class, to be initialized by the app factory
mongo = PyMongo()


class User:
    """
    User model for MongoDB.
    Handles password hashing and verification.
    """

    # Modified __init__ to include interests
    def __init__(
        self,
        full_name,
        email,
        password=None,
        role="Regular User",
        provider="email",
        provider_id=None,
        interests=None,
    ):
        self.full_name = full_name
        self.email = email
        if password:
            self.password_hash = generate_password_hash(password)
        else:
            self.password_hash = None  # No password for OAuth users
        self.role = role
        self.provider = provider
        self.provider_id = provider_id
        # --- NEW FIELD: Interests ---
        self.interests = (
            interests if interests is not None else []
        )  # Initialize as empty list if None
        # -----------------------------
        self._id = None  # Will be set after save/find operations

    def save(self):
        """
        Saves the user document to the 'users' collection in MongoDB.
        If _id exists, updates the user; otherwise, inserts a new user.
        """
        user_data = {
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,  # Make sure role is saved to DB
            "provider": self.provider,
            "provider_id": self.provider_id,
            "interests": self.interests,  # Include interests in data
        }
        if self.password_hash:
            user_data["password"] = self.password_hash

        if self._id:  # If _id is set, it's an update operation
            # Use $set to update only the specified fields
            result = mongo.db.users.update_one({"_id": self._id}, {"$set": user_data})
            # Check if any modification actually occurred
            if result.matched_count > 0:
                return self._id
            else:
                # This case might mean the user was not found or no changes were needed
                return None
        else:  # New user insertion
            user_data["created_at"] = datetime.datetime.utcnow()
            result = mongo.db.users.insert_one(user_data)
            self._id = result.inserted_id
            return self._id

    def to_dict(self):
        """Converts user object to a dictionary suitable for JWT payload or API response."""
        return {
            "id": str(
                self._id
            ),  # Ensure _id is converted to string and named 'id' or 'userId'
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,  # FIXED: Include role in the dictionary
            "provider": self.provider,
            "provider_id": self.provider_id,
            "interests": self.interests,  # Include interests in the dictionary
        }

    @staticmethod
    def from_mongo_doc(doc):
        """Creates a User object from a MongoDB document."""
        if not doc:
            return None
        user = User(
            full_name=doc.get("full_name"),
            email=doc.get("email"),
            password=None,  # Password is hashed, don't pass raw here
            role=doc.get("role", "Regular User"),
            provider=doc.get("provider", "email"),
            provider_id=doc.get("provider_id"),
            interests=doc.get("interests", []),  # Load interests, default to empty list
        )
        user.password_hash = doc.get("password")  # Set the hashed password
        user._id = doc["_id"]  # Set the ObjectId
        return user

    @staticmethod
    def find_by_email(email):
        """Finds a user by their email address."""
        doc = mongo.db.users.find_one({"email": email})
        return User.from_mongo_doc(doc)

    @staticmethod
    def find_by_id(user_id):
        """Finds a user by their MongoDB _id."""
        if not ObjectId.is_valid(user_id):
            return None
        doc = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        return User.from_mongo_doc(doc)

    @staticmethod
    def find_by_provider(provider, provider_id):
        """Finds a user by their OAuth provider and provider-specific ID."""
        doc = mongo.db.users.find_one(
            {"provider": provider, "provider_id": provider_id}
        )
        return User.from_mongo_doc(doc)

    def check_password(self, password):
        """Checks if the provided password matches the hashed password."""
        return self.password_hash and check_password_hash(self.password_hash, password)


class BlacklistToken:
    """
    Token Model for storing blacklisted JWT tokens.
    """

    def __init__(self, token):
        self.token = token
        self.blacklisted_on = datetime.datetime.utcnow()

    def save(self):
        """Saves the blacklisted token to the database."""
        try:
            mongo.db.blacklist_tokens.insert_one(
                {"token": self.token, "blacklisted_on": self.blacklisted_on}
            )
            return True
        except Exception as e:
            print(f"Error blacklisting token: {e}")
            return False

    @staticmethod
    def is_blacklisted(token):
        """Checks if a token is blacklisted."""
        return mongo.db.blacklist_tokens.find_one({"token": token}) is not None


# Ensure unique indexes on startup
# This will be called in create_app after mongo.init_app(app)
def ensure_mongo_indexes():
    """Ensures necessary MongoDB indexes are created."""
    try:
        # Unique index for email (for traditional login and OAuth conflict detection)
        mongo.db.users.create_index("email", unique=True, sparse=True)
        # Unique index for provider + provider_id (for OAuth users)
        mongo.db.users.create_index(
            [("provider", 1), ("provider_id", 1)], unique=True, sparse=True
        )
        # Index for blacklist tokens
        mongo.db.blacklist_tokens.create_index("token", unique=True)
        print("MongoDB indexes ensured successfully.")
    except Exception as e:
        print(f"Error ensuring MongoDB indexes: {e}")
