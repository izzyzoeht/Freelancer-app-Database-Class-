# main class that creates the web application
from flask import Flask, jsonify
# Flask = creates your app
# jsonify = converts Python dictionary to proper JSON response


from dotenv import load_dotenv

# lets Python read environment variables
import os

# loads the .env file — must be called before anything else
load_dotenv()

# creates your Flask application
# __name__ tells Flask  app lives
app = Flask(__name__)

# sets secret key for sessions — login system needs this
# os.getenv reads from .env file — if not found uses 'dev-secret-key' as default
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')

@app.route('/')
# tells Flask: when someone visits "/" run the home function below
def home():
    return jsonify({"message": "Freelancer API is running!"})
    # jsonify converts the dictionary to proper JSON format

# starts the server when you run "python app.py"
if __name__ == '__main__':
    app.run(debug=True)
    # debug=True means server auto-restarts when you change code

