# main class that creates the web application
from flask import Flask, jsonify
# Flask = creates your app


# reads .env file so Flask can use secret settings
from dotenv import load_dotenv

# lets Python read environment variables
import os

load_dotenv()
# loads the .env file — must be called before anything else

app = Flask(__name__)
# creates your Flask application
# __name__ tells Flask where your app lives

app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')
# sets secret key for sessions — login system needs this

# import and register blueprints
from routes.auth import auth
# imports the auth Blueprint from routes/auth.py

app.register_blueprint(auth, url_prefix='/api/auth')
# registers the auth Blueprint with Flask
# url_prefix means all auth routes start with /api/auth/
# so /register becomes /api/auth/register
# so /login becomes /api/auth/login
# so /logout becomes /api/auth/logout

@app.route('/')
def home():
    return jsonify({"message": "Freelancer API is running!"})
    # confirms server is working

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
    # starts server when you run "python app.py"
    # debug=True = server restarts automatically when you change code


