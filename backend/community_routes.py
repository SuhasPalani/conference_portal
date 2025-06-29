from flask import Blueprint, request, jsonify, current_app
from models import User, Team, mongo  # Import Team model
from auth import jwt_required, get_jwt_identity  # For authentication
from flask_jwt_extended import create_access_token
from bson import ObjectId  # For working with MongoDB ObjectIds
from functools import wraps

community_bp = Blueprint("community", __name__, url_prefix="/api")


# --- Helper for role check (similar to admin_required, but for specific roles) ---
def role_required(required_role):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            if request.method == "OPTIONS":
                return "", 200  # Allow OPTIONS for CORS preflight

            current_user_identity = get_jwt_identity()
            if current_user_identity.get("role") != required_role:
                return jsonify(
                    {"message": f"Access Denied: {required_role} role required."}
                ), 403
            return fn(*args, **kwargs)

        return decorator

    return wrapper


# --- Mentor Routes ---
@community_bp.route("/mentors", methods=["GET", "OPTIONS"])
@jwt_required()  # Any logged-in user can search for mentors
def get_mentors():
    if request.method == "OPTIONS":
        return "", 200

    search_term = request.args.get("search", "")
    skill = request.args.get("skill", "")

    try:
        mentors = User.find_mentors(search_term=search_term, skill=skill)
        mentors_data = [m.to_dict() for m in mentors]
        return jsonify({"success": True, "mentors": mentors_data}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching mentors: {e}", exc_info=True)
        return jsonify({"success": False, "message": "Failed to fetch mentors."}), 500


@community_bp.route("/mentors/<user_id>/connect", methods=["POST", "OPTIONS"])
@jwt_required()
def connect_with_mentor(user_id):
    if request.method == "OPTIONS":
        return "", 200

    current_user_identity = get_jwt_identity()
    requester_id = current_user_identity.get("id")

    if str(requester_id) == user_id:
        return jsonify(
            {"success": False, "message": "You cannot connect with yourself."}
        ), 400

    try:
        mentor = User.find_by_id(user_id)
        if not mentor or mentor.role != "Mentor" or mentor.status != "active":
            return jsonify(
                {"success": False, "message": "Mentor not found or not active."}
            ), 404

        # In a real app, you'd record this connection request in the DB
        # For now, simulate success
        current_app.logger.info(
            f"User {requester_id} attempting to connect with mentor {user_id}"
        )
        return jsonify(
            {"success": True, "message": "Connection request sent to mentor."}
        ), 200
    except Exception as e:
        current_app.logger.error(f"Error connecting with mentor: {e}", exc_info=True)
        return jsonify(
            {"success": False, "message": "Failed to send connection request."}
        ), 500


# --- Team Routes ---
# In your get_teams route
@community_bp.route("/teams", methods=["GET"])
@jwt_required()
def get_teams():
    try:
        search_term = request.args.get("search", "")
        category = request.args.get("category", "")

        teams = Team.get_all_teams(search_term=search_term, category=category)
        teams_data = []
        for team in teams:
            team_dict = team.to_dict()  # Get the dictionary representation
            # Add leader's full_name to the dictionary for frontend display
            leader = User.find_by_id(team.leader_id)
            if leader:
                team_dict["leader"] = {
                    "full_name": leader.full_name,
                    "id": str(leader._id),
                }
            else:
                team_dict["leader"] = None  # Or handle as appropriate

            # Ensure 'status' is updated based on current members before sending
            # The frontend expects 'status' to reflect "Team full" etc.
            if len(team.members) >= team.max_members:
                team_dict["status"] = "Team full"
            elif len(team.members) >= team.max_members * 0.8:  # Example: 80% full
                team_dict["status"] = "Almost full"
            else:
                team_dict["status"] = "Looking for members"

            teams_data.append(team_dict)  # Append the dictionary, not the Team object

        return jsonify({"success": True, "data": teams_data}), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching teams: {e}")
        return jsonify({"success": False, "message": "Failed to fetch teams."}), 500


@community_bp.route("/teams", methods=["POST", "OPTIONS"])
@jwt_required()
@role_required("Regular User")  # Only Regular Users can create teams
def create_team():
    if request.method == "OPTIONS":
        return "", 200

    current_user_identity = get_jwt_identity()
    leader_id = current_user_identity.get("id")

    data = request.get_json()
    name = data.get("name")
    description = data.get("description")
    category = data.get("category")
    max_members = data.get("maxMembers")
    skills_needed = data.get("skillsNeeded")

    if not all([name, description, category, max_members is not None]):
        return jsonify(
            {"success": False, "message": "Missing required team fields."}
        ), 400

    try:
        # Check if user is already in a team
        user_in_db = User.find_by_id(leader_id)
        if user_in_db.team_id:
            return jsonify(
                {
                    "success": False,
                    "message": "You are already part of a team. Please leave your current team before creating a new one.",
                }
            ), 409

        # Check if team name already exists
        existing_team = mongo.db.teams.find_one({"name": name})
        if existing_team:
            return jsonify(
                {"success": False, "message": "A team with this name already exists."}
            ), 409

        new_team = Team(
            name, description, category, leader_id, max_members, skills_needed
        )
        team_id = new_team.save()

        if not team_id:
            current_app.logger.error(f"Failed to create team for leader {leader_id}")
            return jsonify({"success": False, "message": "Failed to create team."}), 500

        # Update leader's user record to reflect team membership
        user_in_db.team_id = team_id
        user_in_db.team_name = name
        user_in_db.save()

        # Generate a new token for the leader with updated team info
        updated_leader_user = User.find_by_id(leader_id)  # Re-fetch to get latest state
        new_leader_token = create_access_token(identity=updated_leader_user.to_dict())

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Team created successfully!",
                    "team": new_team.to_dict(),
                    "user": updated_leader_user.to_dict(),  # Return updated user for frontend context
                    "token": new_leader_token,  # Return new token for frontend context
                }
            ),
            201,
        )

    except Exception as e:
        current_app.logger.error(f"Error creating team: {e}", exc_info=True)
        return jsonify(
            {"success": False, "message": "An error occurred while creating the team."}
        ), 500


@community_bp.route("/teams/<team_id>/join", methods=["POST", "OPTIONS"])
@jwt_required()
@role_required("Regular User")  # Only Regular Users can join teams
def join_team(team_id):
    if request.method == "OPTIONS":
        return "", 200

    current_user_identity = get_jwt_identity()
    requester_id = current_user_identity.get("id")

    try:
        if not ObjectId.is_valid(team_id):
            return jsonify(
                {"success": False, "message": "Invalid team ID format."}
            ), 400

        team = Team.find_by_id(team_id)
        if not team:
            return jsonify({"success": False, "message": "Team not found."}), 404

        if team.leader_id == ObjectId(requester_id):
            return jsonify(
                {"success": False, "message": "You are the leader of this team."}
            ), 400

        if ObjectId(requester_id) in team.members:
            return jsonify(
                {"success": False, "message": "You are already a member of this team."}
            ), 409

        if len(team.members) >= team.max_members:
            return jsonify({"success": False, "message": "Team is full."}), 409

        # Check if user is already in another team
        user_in_db = User.find_by_id(requester_id)
        if user_in_db.team_id:
            return jsonify(
                {
                    "success": False,
                    "message": "You are already part of another team. Please leave it before joining a new one.",
                }
            ), 409

        team.members.append(ObjectId(requester_id))
        if len(team.members) == team.max_members:
            team.status = "Full"
        team.save()

        # Update joining user's record
        user_in_db.team_id = team._id
        user_in_db.team_name = team.name
        user_in_db.save()

        # Generate a new token for the joining user with updated team info
        updated_user = User.find_by_id(requester_id)  # Re-fetch to get latest state
        new_user_token = create_access_token(identity=updated_user.to_dict())

        return (
            jsonify(
                {
                    "success": True,
                    "message": f"Successfully joined team '{team.name}'!",
                    "team": team.to_dict(),
                    "user": updated_user.to_dict(),  # Return updated user for frontend context
                    "token": new_user_token,  # Return new token for frontend context
                }
            ),
            200,
        )

    except Exception as e:
        current_app.logger.error(f"Error joining team: {e}", exc_info=True)
        return jsonify(
            {"success": False, "message": "An error occurred while joining the team."}
        ), 500


@community_bp.route("/teams/<team_id>/leave", methods=["POST", "OPTIONS"])
@jwt_required()
def leave_team(team_id):
    if request.method == "OPTIONS":
        return "", 200

    current_user_identity = get_jwt_identity()
    user_id = current_user_identity.get("id")

    try:
        if not ObjectId.is_valid(team_id):
            return jsonify(
                {"success": False, "message": "Invalid team ID format."}
            ), 400

        team = Team.find_by_id(team_id)
        if not team:
            return jsonify({"success": False, "message": "Team not found."}), 404

        if ObjectId(user_id) not in team.members:
            return jsonify(
                {"success": False, "message": "You are not a member of this team."}
            ), 400

        if team.leader_id == ObjectId(user_id):
            # Option: Disband team if leader leaves and no members, or transfer leadership
            return jsonify(
                {
                    "success": False,
                    "message": "Leaders cannot directly 'leave' a team; they must disband it or transfer leadership.",
                }
            ), 403

        team.members.remove(ObjectId(user_id))
        team.status = "Looking for members"  # Status changes as a member left
        team.save()

        # Update leaving user's record
        user_in_db = User.find_by_id(user_id)
        user_in_db.team_id = None
        user_in_db.team_name = None
        user_in_db.save()

        # Generate a new token for the leaving user with updated team info
        updated_user = User.find_by_id(user_id)  # Re-fetch to get latest state
        new_user_token = create_access_token(identity=updated_user.to_dict())

        return (
            jsonify(
                {
                    "success": True,
                    "message": f"Successfully left team '{team.name}'.",
                    "team": team.to_dict(),
                    "user": updated_user.to_dict(),  # Return updated user for frontend context
                    "token": new_user_token,  # Return new token for frontend context
                }
            ),
            200,
        )

    except Exception as e:
        current_app.logger.error(f"Error leaving team: {e}", exc_info=True)
        return jsonify(
            {"success": False, "message": "An error occurred while leaving the team."}
        ), 500


# Endpoint to disband a team (only by leader)
@community_bp.route("/teams/<team_id>/disband", methods=["DELETE", "OPTIONS"])
@jwt_required()
def disband_team(team_id):
    if request.method == "OPTIONS":
        return "", 200

    current_user_identity = get_jwt_identity()
    user_id = current_user_identity.get("id")

    try:
        if not ObjectId.is_valid(team_id):
            return jsonify(
                {"success": False, "message": "Invalid team ID format."}
            ), 400

        team = Team.find_by_id(team_id)
        if not team:
            return jsonify({"success": False, "message": "Team not found."}), 404

        if team.leader_id != ObjectId(user_id):
            return jsonify(
                {
                    "success": False,
                    "message": "Only the team leader can disband the team.",
                }
            ), 403

        # Clear team_id and team_name for all members
        mongo.db.users.update_many(
            {"_id": {"$in": team.members}},
            {"$set": {"team_id": None, "team_name": None}},
        )

        # Delete the team
        mongo.db.teams.delete_one({"_id": team._id})

        # Update the leader's user record (if they are still logged in)
        updated_leader_user = User.find_by_id(user_id)
        new_leader_token = None
        if updated_leader_user:
            new_leader_token = create_access_token(
                identity=updated_leader_user.to_dict()
            )

        return jsonify(
            {
                "success": True,
                "message": f"Team '{team.name}' disbanded successfully.",
                "user": updated_leader_user.to_dict()
                if updated_leader_user
                else None,  # For immediate context update
                "token": new_leader_token,  # New token if leader is still logged in
            }
        ), 200

    except Exception as e:
        current_app.logger.error(f"Error disbanding team: {e}", exc_info=True)
        return jsonify(
            {
                "success": False,
                "message": "An error occurred while disbanding the team.",
            }
        ), 500
