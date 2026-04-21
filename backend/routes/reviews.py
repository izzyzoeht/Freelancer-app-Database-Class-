from flask import Blueprint , request , jsonify , session
#Blueprint = organizes review routes into this separate file
# request = reads data sent from the frontend
# jsonify = sends data back as JSON
# session = checks who is logged in

import mysql.connector 
# mysql.connector = connects to MySQ

from config import Config
#import database credentials from config.py

reviews = Blueprint('reviews', __name__)
#creates a Blueprint called "reviews"

def get_db():
    #helper function that creates a new MySQL connection
    return mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME

    )
@reviews.route('/add',methods=['POST'])
# when frontend sends POST to /api/reviews/add 
def add_review():
    data = request.get_json(force=True)
    #reads JSON data sent from frontend
    #if content-type header is missing 
    freelancer_id = data.get('freelancer_id')
    #ID of the freelancer being reviewed 
    client_id = data.get('client_id')

    rating = data.get('rating')
    comment = data.get('comment','')
    #written review test p defaults to empty string if not provided

    if not freelancer_id or not client_id or not rating : 
        #checkig if required  fields are missing 
        return jsonify({ 'error': 'freelancer_id . client_id and rating are required '})
    if not isinstance(rating , int) or rating < 1 or rating >5 : 
        return jsonify({'error': 'Rating must be a number between 1 and 5'}) ,400
    db = get_db()
    cursor = db.cursor()
     
    cursor.execute(
        "INSERT INTO reviews (freelancer_id , client_id , rating , comment) VALUES (%s,%s,%s,%s),"
         (freelancer_id, client_id, rating,comment)

     )
    db.commit()
    
    cursor.close()
    db.close()

    return jsonify({'message': 'Review added successfully'}), 201
@reviews.route('/freelancer/<int:freelancer_id>',method=['GET'])
#when frontend sends get to 
# <int:freelancer_id> = grabs the ID number from URL
def get_reviews(freelancer_id) :
    db = get_db()
    cursor = db.cursor(dictionary= True)
    #dicitionary=True makes each row come back as a dict instead of a tuple
    # we get {"rating ": 5 , "comment":"great"} instead of (5,"great")

    cursor.execute(
        "SELECT * FROM reviews WHERE freelancer_id = %s ORDER BY created_at DESC", 
        (freelancer_id )
        # raw SQL SELECT  get all reviews for this freelancer
        # ORDER BY created_at DESC = newest reviews first 
    )

    results = cursor.fetchall()
   
    cursor.close()
    db.close()

    return jsonify(results),200 
    #200 = success return the list of reviews as JSON

@reviews.route('/average/<int:freelancer_id>', methods=['GET'])
def get_average_rating (freelancer_id):
    db = get_db()
    cursor =db.cursor()
    
    cursor.execute(
        "SELECT AVG(rating) as average_rating , COUNT(*) as total_reviews FROM reviews WHERE freelancer_id = %s", 
        (freelancer_id,)
    #AVG()= calculate the avergae
    #count() = counts total number of reviews

    ) 

    result = cursor.fetchone()
    db.close()
    average = round(result[0],2 ) if result[0] else 0
    # rounds average to 2 decimal places
    #if no reviews exist result[0] is none so we return 0

    total = result[1]
    #total number of review

    return jsonif({
        'freelancer_id' : freelancer_id
        'average_rating': average,
        'total_reviews' : total
    }),200
# returns the average rating and total review count 