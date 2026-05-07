from flask import Blueprint , request, jsonify 
#Blueprint
#request
#jsonify 

import mysql.connector 

from config import Config

notifications = Blueprint('notifications',__name__ )
#creating blueprint called 'notification 
# all notification routes will be groued here

def get_db():
    #helper function that creates a newSQL connection 
    # called every time we need to talk to the database

    return mysql.connectior.connect (
    
    host= Config.DB_HOST,
    User=Config.DB_USER,
    password=Config.DB_PASSWORD,
    database=Config.DB_NAME
    )
@notifications.route('/send',methods=['POST'])
#When frontend sends POST to /api/notifications/send

def send_notification():
    data= request.get_json(force=True)
    #reads JSON data sent from frontend
    
    user_id = data.get('user_id')
    message = data.get('message')
    #this notification message text 

    if not user_id or not message: 
        return jsonify({'error': 'user_id and message are required'}),400
    db = get_db()
    cursor = db.cursor()
    #open connection to MYSQL

    cursor.execute(
        "INSERT INTO notifications (user_id, message) VALUES (%s,%s)",
        (user_id, message)

        #save notification to database
    )

    db.commit()

    cursor.close()
    db.close()

    return jsonify({'message': 'Notification sent successfully'}), 201
@notifications.route('/user/<int:user_id>', methods=['GET'])
# frontend sends GET to /api/notification/user/123

def get_notfications(user_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    #dictionary=true  makes each row come back as a dict

    cursor.execute(
    "SELECT * FROM notifications WHERE user_id =%s ORDER BY created_at DESC",
    (user_id,)
    # get all notification for this user
    # ORDER by created_at DESC

)
    results = cursor.fetchall()
    cursor.close()
    db.close()

    return jsonify(results),200
@notifications.route('/read/<int:notification_id>', methods=['PUT'])

def mark_as_read(notification_id) : 
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        "UPDATE notifications SET is_read = 1 WHERE notification_id = %s",
        (notification_id,)
        #1 = read, 0 = unread
    )

    db.commit()
    #saves the update
    cursor.close()
    db.close()

    return jsonify({'message': 'Notification marked as read'}),209
@notifications.route('/unread/<int:user_id>', methods=['GET'])

def get_unread(user_id) :
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
    "SELECT * FROM notifications WHERE user_id = %s AND is_read = 0 ORDER BY created_at DESC",
     (user_id,)
    )

    results = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(results),200
    
    
   