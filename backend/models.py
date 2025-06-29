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

    def __init__(
        self,
        full_name,
        email,
        password=None,
        role="Regular User",  # Default role
        provider="email",
        provider_id=None,
        interests=None,
        status="pending",  # New field: 'pending', 'active', 'inactive', 'rejected', etc.
        # --- NEW FIELDS FOR TEAM/MENTOR ---
        team_id=None,  # ObjectId of the team this user belongs to
        team_name=None,  # Name of the team (for easier lookup/display)
        # For Mentors only (can be added dynamically later too)
        company=None,
        title=None,
        bio=None,
        expertise=None,  # List of strings for mentor's expertise
        availability="Not Specified",  # E.g., "Available", "Limited", "Unavailable"
        # --- END NEW FIELDS ---
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
        self.interests = (
            interests if interests is not None else []
        )  # Initialize as empty list if None
        self.status = status  # Initialize status
        self._id = None  # Will be set after save/find operations
        self.created_at = None  # Will be set on first save
        self.last_updated_at = None  # New field for tracking updates

        # --- NEW FIELDS ASSIGNMENT ---
        self.team_id = team_id
        self.team_name = team_name
        self.company = company
        self.title = title
        self.bio = bio
        self.expertise = expertise if expertise is not None else []
        self.availability = availability
        # --- END NEW FIELDS ASSIGNMENT ---

    def save(self):
        """
        Saves the user document to the 'users' collection in MongoDB.
        If _id exists, updates the user; otherwise, inserts a new user.
        """
        user_data = {
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "provider": self.provider,
            # IMPORTANT: Only include provider_id if it's not None
            # This makes the sparse index work correctly below.
            "interests": self.interests,
            "status": self.status,
            "last_updated_at": datetime.datetime.utcnow(),
            # --- NEW FIELDS FOR SAVE ---
            "team_id": self.team_id,
            "team_name": self.team_name,
            "company": self.company,
            "title": self.title,
            "bio": self.bio,
            "expertise": self.expertise,
            "availability": self.availability,
            # --- END NEW FIELDS FOR SAVE ---
        }
        if self.password_hash:
            user_data["password"] = self.password_hash
        if self.provider_id is not None:  # Only add provider_id if it's set
            user_data["provider_id"] = self.provider_id

        if self._id:  # If _id is set, it's an update operation
            result = mongo.db.users.update_one({"_id": self._id}, {"$set": user_data})
            if result.matched_count > 0:
                return self._id
            else:
                return None
        else:  # New user insertion
            user_data["created_at"] = datetime.datetime.utcnow()
            result = mongo.db.users.insert_one(user_data)
            self._id = result.inserted_id
            return self._id

    def to_dict(self):
        """Converts user object to a dictionary suitable for JWT payload or API response."""
        return {
            "id": str(self._id),
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "provider": self.provider,
            "provider_id": self.provider_id,  # Can be None for email users
            "interests": self.interests,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_updated_at": self.last_updated_at.isoformat()
            if self.last_updated_at
            else None,
            # --- NEW FIELDS FOR DICT ---
            "team_id": str(self.team_id) if self.team_id else None,
            "team_name": self.team_name,
            "company": self.company,
            "title": self.title,
            "bio": self.bio,
            "expertise": self.expertise,
            "availability": self.availability,
            # --- END NEW FIELDS FOR DICT ---
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
            provider_id=doc.get("provider_id"),  # Load as is
            interests=doc.get("interests", []),
            status=doc.get("status", "pending"),
            # --- LOAD NEW FIELDS ---
            team_id=doc.get("team_id"),  # Stored as ObjectId
            team_name=doc.get("team_name"),
            company=doc.get("company"),
            title=doc.get("title"),
            bio=doc.get("bio"),
            expertise=doc.get("expertise", []),
            availability=doc.get("availability", "Not Specified"),
            # --- END LOAD NEW FIELDS ---
        )
        user.password_hash = doc.get("password")  # Set the hashed password
        user._id = doc["_id"]  # Set the ObjectId
        user.created_at = doc.get("created_at")
        user.last_updated_at = doc.get("last_updated_at")
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

    @staticmethod
    def get_all_users():
        """Fetches all users from the database."""
        users_cursor = mongo.db.users.find({})
        return [User.from_mongo_doc(doc) for doc in users_cursor]

    @staticmethod
    def find_mentors(search_term="", skill=""):
        """Finds users with 'Mentor' role, with optional search and skill filtering."""
        query = {"role": "Mentor", "status": "active"}  # Only active mentors
        if search_term:
            # Case-insensitive search across name, company, title, bio
            query["$or"] = [
                {"full_name": {"$regex": search_term, "$options": "i"}},
                {"company": {"$regex": search_term, "$options": "i"}},
                {"title": {"$regex": search_term, "$options": "i"}},
                {"bio": {"$regex": search_term, "$options": "i"}},
            ]
        if skill:
            query["expertise"] = (
                skill  # Find documents where 'expertise' array contains 'skill'
            )

        mentors_cursor = mongo.db.users.find(query)
        return [User.from_mongo_doc(doc) for doc in mentors_cursor]

    @staticmethod
    def find_potential_teammates(
        current_user_id, search_term="", interests=None
    ):  # Changed interests=[] to interests=None
        """
        Finds active 'Regular User's who are not in a team,
        and whose interests overlap with provided interests,
        with optional search.
        Excludes the current user.
        """
        query = {
            "role": "Regular User",
            "status": "active",
            "team_id": None,  # Not currently in a team
            "_id": {"$ne": ObjectId(current_user_id)},  # Exclude current user
        }
        if search_term:
            query["$or"] = [
                {"full_name": {"$regex": search_term, "$options": "i"}},
                {"email": {"$regex": search_term, "$options": "i"}},
            ]

        # Filter by interests overlap only if interests are provided and not empty
        if (
            interests and len(interests) > 0
        ):  # Ensure interests is not None and not empty
            query["interests"] = {
                "$in": interests
            }  # Match if any of user's interests are in the search list

        teammates_cursor = mongo.db.users.find(query)
        return [User.from_mongo_doc(doc) for doc in teammates_cursor]

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


class Team:
    """
    Team model for MongoDB.
    """

    def __init__(
        self, name, description, category, leader_id, max_members=5, skills_needed=None
    ):
        self.name = name
        self.description = description
        self.category = category
        self.leader_id = ObjectId(leader_id)  # Store as ObjectId
        self.members = [ObjectId(leader_id)]  # Leader is the first member
        self.max_members = max_members
        self.skills_needed = skills_needed if skills_needed is not None else []
        self.status = (
            "Looking for members"  # "Looking for members", "Full", "Completed", etc.
        )
        self._id = None
        self.created_at = datetime.datetime.utcnow()
        self.last_updated_at = datetime.datetime.utcnow()

    def save(self):
        """
        Saves the team document to the 'teams' collection in MongoDB.
        If _id exists, updates the team; otherwise, inserts a new team.
        """
        team_data = {
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "leader_id": self.leader_id,
            "members": self.members,
            "max_members": self.max_members,
            "skills_needed": self.skills_needed,
            "status": self.status,
            "last_updated_at": datetime.datetime.utcnow(),
        }

        if self._id:
            result = mongo.db.teams.update_one({"_id": self._id}, {"$set": team_data})
            if result.matched_count > 0:
                return self._id
            else:
                return None
        else:
            team_data["created_at"] = self.created_at
            result = mongo.db.teams.insert_one(team_data)
            self._id = result.inserted_id
            return self._id

    def to_dict(self):
        """Converts team object to a dictionary suitable for API response."""
        return {
            "id": str(self._id),
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "leader_id": str(self.leader_id),
            "members": [
                str(member_id) for member_id in self.members
            ],  # Convert ObjectIds to strings
            "current_members": len(self.members),  # Helper for frontend
            "max_members": self.max_members,
            "skills_needed": self.skills_needed,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_updated_at": self.last_updated_at.isoformat()
            if self.last_updated_at
            else None,
        }

    @staticmethod
    def from_mongo_doc(doc):
        """Creates a Team object from a MongoDB document."""
        if not doc:
            return None
        team = Team(
            name=doc.get("name"),
            description=doc.get("description"),
            category=doc.get("category"),
            leader_id=doc.get("leader_id"),
            # Change this line: Provide a default value for max_members
            max_members=doc.get("max_members", 5),  # Assuming 5 is your default
            skills_needed=doc.get("skills_needed", []),
        )
        team._id = doc["_id"]
        team.members = doc.get("members", [])
        team.status = doc.get("status", "Looking for members")
        team.created_at = doc.get("created_at")
        team.last_updated_at = doc.get("last_updated_at")
        return team

    @staticmethod
    def find_by_id(team_id):
        """Finds a team by its MongoDB _id."""
        if not ObjectId.is_valid(team_id):
            return None
        doc = mongo.db.teams.find_one({"_id": ObjectId(team_id)})
        return Team.from_mongo_doc(doc)

    @staticmethod
    def get_all_teams(search_term="", category=""):
        query = {}

        if search_term:
            query["$or"] = [
                {"name": {"$regex": search_term, "$options": "i"}},
                {"description": {"$regex": search_term, "$options": "i"}},
            ]

        if category:
            query["category"] = category

        teams_cursor = mongo.db.teams.find(query)  # Changed variable name for clarity
        # Corrected line: Use from_mongo_doc to construct Team objects
        return [Team.from_mongo_doc(doc) for doc in teams_cursor]


# Ensure unique indexes on startup
# This will be called in create_app after mongo.init_app(app)
def ensure_mongo_indexes():
    """Ensures necessary MongoDB indexes are created."""
    try:
        # Unique index for email
        mongo.db.users.create_index("email", unique=True)

        # Partial Unique index for provider + provider_id, ONLY when provider_id exists
        # This works because provider_id is only stored for OAuth users (not for 'email' provider users)
        mongo.db.users.create_index(
            [("provider", 1), ("provider_id", 1)],
            unique=True,
            partialFilterExpression={
                "provider_id": {"$exists": True}
            },  # Simplified: just check for existence
            name="oauth_provider_index",
        )

        # Index for blacklist tokens
        mongo.db.blacklist_tokens.create_index("token", unique=True, sparse=True)

        # NEW: Index for team name (optional, but good for uniqueness)
        mongo.db.teams.create_index("name", unique=True)
        # NEW: Index for leader_id in teams for quick lookups
        mongo.db.teams.create_index("leader_id")
        # NEW: Index for members in teams for quick lookups (useful for finding teams a user is in)
        mongo.db.teams.create_index("members")

        print("MongoDB indexes ensured successfully.")
    except Exception as e:
        print(f"Error ensuring MongoDB indexes: {e}")
