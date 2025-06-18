from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import mongo
from routes import auth_bp, main_bp
import os


def create_app():
    """
    Factory function to create and configure the Flask application.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all routes and origins (adjust for production)
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": "http://localhost:3000",
                "supports_credentials": True,
            }
        },
    )

    # Initialize PyMongo with the app
    mongo.init_app(app)

    # Test MongoDB connection
    with app.app_context():
        try:
            # Test the connection
            mongo.db.command("ping")
            print("✅ MongoDB connection successful!")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(main_bp, url_prefix="/api")

    @app.route("/")
    def index():
        return "Conference Portal Backend API is running!"

    @app.errorhandler(404)
    def not_found(error):
        """
        Custom 404 error handler.
        """
        return jsonify({"message": "Not Found"}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        """
        Custom 500 error handler.
        """
        app.logger.error(f"Server Error: {error}")
        return jsonify({"message": "Internal Server Error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
