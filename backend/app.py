# main class that creates the web application
from flask import Flask, jsonify
# Flask = creates your app

from dotenv import load_dotenv
# reads .env file so Flask can use secret settings

import os
# lets Python read environment variables

load_dotenv()
# loads the .env file — must be called before anything else

app = Flask(__name__)
# creates your Flask application

app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')
# sets secret key for sessions — login system needs this

# import and register all blueprints
from routes.auth import auth
from routes.reviews import reviews
from routes.notifications import notifications

app.register_blueprint(auth, url_prefix='/api/auth')
# registers the auth Blueprint with Flask
# url_prefix means all auth routes start with /api/auth/
# so /register becomes /api/auth/register
# so /login becomes /api/auth/login
# so /logout becomes /api/auth/logout
app.register_blueprint(reviews , url_prefix= '/api/reviews')
app.register_blueprint(notifications , url_prefix='/api/notifications')


@app.route('/')
def home():
    return jsonify({"message": "Freelancer API is running!"})
    # confirms server is working

if __name__ == '__main__':
    app.run(debug=True)
    # starts server when you run "python app.py"
    # debug=True = server restarts automatically when you change code


