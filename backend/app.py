# backend/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import mongo, ensure_mongo_indexes # Import mongo and the index function
from auth import configure_auth, jwt, oauth # Import configure_auth, jwt, oauth
from routes import api_bp # Your main blueprint (renamed from auth_bp and main_bp combined into api_bp)
import os

def create_app():
    """
    Factory function to create and configure the Flask application.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize CORS
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": Config.FRONTEND_URL, # Use the configured frontend URL
                "supports_credentials": True,
            }
        },
    )

    # Initialize PyMongo with the app
    mongo.init_app(app)

    # Test MongoDB connection and ensure indexes
    with app.app_context():
        try:
            mongo.db.command("ping")
            print("✅ MongoDB connection successful!")
            ensure_mongo_indexes() # Ensure indexes after connection is established
        except Exception as e:
            print(f"❌ MongoDB connection failed or index creation error: {e}")

    # Configure Authlib and Flask-JWT-Extended
    configure_auth(app) # This will initialize oauth and jwt with the app

    # Register blueprint
    app.register_blueprint(api_bp) # Changed from auth_bp/main_bp to single api_bp with prefix

    @app.route("/")
    def index():
        return "Conference Portal Backend API is running!"

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"message": "Not Found"}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.error(f"Server Error: {error}")
        return jsonify({"message": "Internal Server Error"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)