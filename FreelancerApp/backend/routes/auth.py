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
# frontend sends POST to /api/auth/register
def register():
    data = request.get_json(force=True)

    first_name = data.get('first_name')
    last_name  = data.get('last_name')
    email      = data.get('email')
    password   = data.get('password')
    user_type  = data.get('user_type')   # 'Employer' | 'Tradesperson' | 'Junior'
    city       = data.get('city', '')
    state      = data.get('state', '')

    # Validate required fields
    if not first_name or not last_name or not email or not password or not user_type:
        return jsonify({'error': 'All fields required'}), 400

    # Validate user_type matches DB ENUM
    if user_type not in ('Employer', 'Tradesperson', 'Junior'):
        return jsonify({'error': 'Invalid user type'}), 400

    db = get_db()
    cursor = db.cursor()

    # Check if email already exists
    cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close()
        db.close()
        return jsonify({'error': 'Email already registered'}), 400

    # Insert new user — matches schema.sql column names exactly
    cursor.execute(
        """INSERT INTO users
           (first_name, last_name, email, password_hash, user_type, city, state)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (first_name, last_name, email, password, user_type, city, state)
    )

    db.commit()
    new_user_id = cursor.lastrowid  # grab the new user's ID
    
    session['user_id'] = new_user_id

    cursor.close()
    db.close()

    return jsonify({
    'message': 'User registered successfully',
    'user_id': new_user_id,
    'first_name': first_name,
    'last_name': last_name,
    'email': email,
    'user_type': user_type,
    'city': city,
    'state': state
}), 201

@auth.route('/login', methods=['POST'])
# frontend sends POST to /api/auth/login
def login():
    data = request.get_json()

    email    = data.get('email')     # frontend sends email, not user_name
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    db = get_db()
    cursor = db.cursor()

    # Match email + password_hash — columns from schema.sql
    cursor.execute(
        """SELECT user_id, first_name, last_name, email, user_type, city, state
           FROM users
           WHERE email = %s AND password_hash = %s AND is_active = TRUE""",
        (email, password)
    )

    user = cursor.fetchone()
    cursor.close()
    db.close()

    if user:
        # Store full user info in session
        session['user_id']   = user[0]
        session['user_type'] = user[4]
        return jsonify({
            'message':    'Login successful',
            'user_id':    user[0],
            'first_name': user[1],
            'last_name':  user[2],
            'email':      user[3],
            'user_type':  user[4],
            'city':       user[5],
            'state':      user[6],
        }), 200
    else:
        return jsonify({'error': 'Invalid email or password'}), 401

@auth.route('/logout', methods=['POST'])
# when frontend sends POST to /api/auth/logout
def logout():
    session.clear()
    # removes all session data - user is now logged out
    # clear(): deletes the stored user_id
    return jsonify({'message': 'Logged out successfully'}), 200