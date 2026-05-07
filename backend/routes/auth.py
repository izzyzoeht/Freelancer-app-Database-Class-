from flask import Blueprint, request, jsonify, session
# Blueprint = organize routes into separate file
# request = reading data from the frontEnd
# jsonify = send data back to the frontend 
# session = remember who logged in

import mysql.connector
# connect MySQL database with raw SQL

from werkzeug.security import check_password_hash, generate_password_hash

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
    data = request.get_json(force=True)
    # reads the JSON data from the frontEnd 

    password = data.get('password')
    # gets password from the request data

    email = data.get('email')
    # gets email from the request data
    first_name = data.get('first_name')
    #get first_name from the request data 
    last_name = data.get('last_name')
    #get last_name  from the request data
    phone = data.get('phone')

    user_type = data.get('user_type','employer')

    if not first_name or not last_name or not password or not email:
        # check if any required field is missing
        return jsonify({'error': 'All fields required'}), 400



    password_hash = generate_password_hash(password)
    #hash plain text passord 
    db = get_db()
    # creating database connection

    cursor = db.cursor(dictionary=True)
    # cursor needed to execute SQL queries

    cursor.execute("SELECT * FROM users WHERE email =%s",(email,))
    # raw SQL — checks if username already exists in database

    if cursor.fetchone():
        # fetchone() gets the first result - if something comes back username is taken
        cursor.close()
        db.close()
        return jsonify({'error': 'User_name already exists'}), 400

    cursor.execute(
    "INSERT INTO users (first_name, last_name, email, password_hash, phone, user_type) VALUES (%s, %s, %s, %s, %s, %s)",
    (first_name, last_name, email, password_hash, phone, user_type)
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

    email = data.get('email')
    # gets username from request data

    password = data.get('password')
    # gets password from request data

    if not email or not password : 
        #check if any required field is missing
        return jsonify({'error': 'All fields required'}), 400

    db = get_db()
    # creating database connection

    cursor = db.cursor(dictionary=True)
    # cursor needed to execute SQL queries
    cursor.execute(
        "SELECT * FROM users WHERE email = %s",
        (email,)
    )
    user = cursor.fetchone()
    # gets the matching user from database — None if not found

    cursor.close()
    db.close()
    # close the connection - to free up database resources

    if user and check_password_hash(user['password_hash'],password):
        # user exists and password matches
        session.clear()
        session['user_id'] = user['user_id']
        # stores user ID in session — remembers they are logged in
        session['user_type'] = user['user_type']
        return jsonify({
            'message': 'Login successful',
            'user_id': user['user_id'],
            'user_type': user['user_type'],
            'first_name': user['first_name']
        }), 200
    else:
        return jsonify({'error': 'Invalid email or password'}),401
        # 401 = unauthorized — wrong credentials

@auth.route('/logout', methods=['POST'])
# when frontend sends POST to /api/auth/logout
def logout():
    session.clear()
    # removes all session data - user is now logged out
    # clear(): deletes the stored user_id
    return jsonify({'message': 'Logged out successfully'}), 200