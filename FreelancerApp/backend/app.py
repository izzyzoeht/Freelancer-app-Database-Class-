from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

# Create a Flask application instance
app = Flask(__name__)

# Set the secret key for sessions and cookies
# If SECRET_KEY is not found in .env, use a default development key
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')

# Configure session cookie settings
app.config.update(
    # Allows cookies to be sent for normal same-site requests
    SESSION_COOKIE_SAMESITE='Lax',

    # False means cookies can be sent over HTTP during local development
    # In production, this should usually be True when using HTTPS
    SESSION_COOKIE_SECURE=False,
)

# Enable CORS so the frontend can communicate with the Flask backend
CORS(
    app,

    # Allow requests only from the Next.js frontend
    origins=["http://localhost:3000"],

    # Allow cookies/sessions to be included in frontend requests
    supports_credentials=True,

    # Allow these request headers
    allow_headers=["Content-Type", "Authorization"],

    # Allow these HTTP methods
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
)

# Import the authentication routes from routes/auth.py
from routes.auth import auth

# Register the authentication blueprint
# All auth routes will start with /api/auth
# Example: /api/auth/login, /api/auth/register
app.register_blueprint(auth, url_prefix='/api/auth')

# Simple test route to check if the backend is running
@app.route('/')
def home():
    return jsonify({"message": "Freelancer API is running!"})

# Run the Flask app only when this file is executed directly
if __name__ == '__main__':
    # Start the development server on port 5001
    app.run(debug=True, port=5001)