from flask import Blueprint, request, jsonify, session
# Blueprint = organize routes into separate file
# request = reading data from the frontEnd
# jsonify = send data back to the frontend 
# session = remember who logged in

import mysql.connector
# connect MySQL database with raw SQL

from config import Config 
# importing our settings from config.py

auth = Blueprint('auth', __name__) 
# creating blueprint called "auth"
#Blueprint : instead of putting all routes in app.py
# blueprint will handle all /auth/routes

def get_db():
    # helper function that creates a MySQL connection
    return mysql.connector.connect(
        host=Config.DB_HOST, #which computer MySQL on 
        user=Config.DB_USER, # Mysql username
        password=Config.DB_PASSWORD, # THE SQL password
        database=Config.DB_NAME # database to use
    )

@auth.route('/register', methods=['POST'])
#front sends POST to /api/auth/register
def register():
    data = request.get_json()
    # reads the JSON data from the frontEnd 

    username = data.get('username')
    # gets username from the request data

    password = data.get('password')
    # gets password from the request data

    email = data.get('email')
    # gets email from the request data

    if not username or not password or not email:
        # check if any required field is missing
        return jsonify({'error': 'All fields required'}), 400

    db = get_db()
    # creating database connection

    cursor = db.cursor()
    # cursor needed to execute SQL queries

    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    # raw SQL — checks if username already exists in database

    if cursor.fetchone():
        # fetchone() gets the first result - if something comes back username is taken
        return jsonify({'error': 'Username already exists'}), 400

    cursor.execute(
        "INSERT INTO users (username, password, email) VALUES (%s, %s, %s)",
        (username, password, email)
        # raw SQL INSERT — adds new user to the database
    )

    db.commit()
    # saving changes to the database - without this nothing gets saved

    cursor.close()
    db.close()
    # closes the connection - to free up database resources

    return jsonify({'message': 'User registered successfully'}), 201
    # 201 means created successfully

@auth.route('/login', methods=['POST'])
# frontend sending POST to /api/auth/login → login function
def login():
    data = request.get_json()
    # reads login form data from frontend

    username = data.get('username')
    # gets username from request data

    password = data.get('password')
    # gets password from request data

    db = get_db()
    # creating database connection

    cursor = db.cursor()
    # cursor needed to execute SQL queries

    cursor.execute(
        "SELECT * FROM users WHERE username = %s AND password = %s",
        (username, password)
        # raw SQL — finds user where username AND password both match
    )

    user = cursor.fetchone()
    # gets the matching user from database — None if not found

    cursor.close()
    db.close()
    # close the connection - to free up database resources

    if user:
        # user exists and password matches
        session['user_id'] = user[0]
        # stores user ID in session — remembers they are logged in
        return jsonify({'message': 'Login successful'}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401
        # 401 = unauthorized — wrong credentials

@auth.route('/logout', methods=['POST'])
# when frontend sends POST to /api/auth/logout
def logout():
    session.clear()
    # removes all session data - user is now logged out
    # clear(): deletes the stored user_id
    return jsonify({'message': 'Logged out successfully'}), 200