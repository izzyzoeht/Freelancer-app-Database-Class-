from flask import Blueprint, request, jsonify
import mysql.connector
from config import Config
# import database credentials from config.py

reviews = Blueprint('reviews', __name__)
# creates a Blueprint called "reviews"

def get_db():
    # helper function that creates a new MySQL connection
    return mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME
    )

@reviews.route('/add', methods=['POST'])
# when frontend sends POST to /api/reviews/add
def add_review():
    data = request.get_json(force=True)
    # reads JSON data sent from frontend

    booking_id = data.get('booking_id')
    # ID of the booking this review is for

    reviewer_user_id = data.get('reviewer_user_id')
    # ID of the user writing the review

    tradesperson_id = data.get('tradesperson_id')
    # ID of the tradesperson being reviewed

    rating = data.get('rating')
    # star rating 1-5

    comment = data.get('comment', '')
    # written review text, defaults to empty string if not provided

    if not booking_id or not reviewer_user_id or not tradesperson_id or not rating:
        # checking if required fields are missing
        return jsonify({'error': 'booking_id, reviewer_user_id, tradesperson_id and rating are required'}), 400

    if not isinstance(rating, int) or rating < 1 or rating > 5:
        # rating must be a number between 1 and 5
        return jsonify({'error': 'Rating must be a number between 1 and 5'}), 400

    db = get_db()
    # creating database connection
    cursor = db.cursor()
    # cursor needed to execute SQL queries

    cursor.execute(
        "INSERT INTO reviews (booking_id, reviewer_user_id, tradesperson_id, rating, comment) VALUES (%s, %s, %s, %s, %s)",
        (booking_id, reviewer_user_id, tradesperson_id, rating, comment)
        # raw SQL INSERT — adds the review to the database
    )

    db.commit()
    # saving changes to the database — without this nothing gets saved

    cursor.close()
    db.close()
    # closes the connection — to free up database resources

    return jsonify({'message': 'Review added successfully'}), 201
    # 201 = created successfully

@reviews.route('/tradesperson/<int:tradesperson_id>', methods=['GET'])
# when frontend sends GET to /api/reviews/tradesperson/<id>
# <int:tradesperson_id> = grabs the ID number from the URL
def get_reviews(tradesperson_id):
    db = get_db()
    # creating database connection
    cursor = db.cursor(dictionary=True)
    # dictionary=True makes each row come back as a dict instead of a tuple
    # we get {"rating": 5, "comment": "great"} instead of (5, "great")

    cursor.execute(
        "SELECT * FROM reviews WHERE tradesperson_id = %s ORDER BY created_at DESC",
        (tradesperson_id,)
        # raw SQL SELECT — gets all reviews for this tradesperson
        # ORDER BY created_at DESC = newest reviews first
    )

    results = cursor.fetchall()
    # fetchall() gets all matching rows

    cursor.close()
    db.close()
    # closes the connection — to free up database resources

    return jsonify(results), 200
    # 200 = success, returns the list of reviews as JSON

@reviews.route('/average/<int:tradesperson_id>', methods=['GET'])
# when frontend sends GET to /api/reviews/average/<id>
def get_average_rating(tradesperson_id):
    db = get_db()
    # creating database connection
    cursor = db.cursor()
    # cursor needed to execute SQL queries

    cursor.execute(
        "SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM reviews WHERE tradesperson_id = %s",
        (tradesperson_id,)
        # AVG() = calculates the average rating
        # COUNT() = counts total number of reviews
    )

    result = cursor.fetchone()
    # fetchone() gets the single result row

    cursor.close()
    db.close()
    # closes the connection — to free up database resources

    average = round(result[0], 2) if result[0] else 0
    # rounds average to 2 decimal places
    # if no reviews exist result[0] is None so we return 0

    total = result[1]
    # total number of reviews

    return jsonify({
        'tradesperson_id': tradesperson_id,
        'average_rating': average,
        'total_reviews': total
    }), 200
    # 200 = success, returns the average rating and total review count

    