import mysql.connector
# mysql.connector = library that lets Python talk to MySQL

from config import Config
# importing our settings from config.py

def get_db():
    # helper function that creates and returns a MySQL connection
    # called every time a route needs to talk to the database
    return mysql.connector.connect(
        host=Config.DB_HOST,         # which computer MySQL is running on
        user=Config.DB_USER,         # MySQL username
        password=Config.DB_PASSWORD, # MySQL password
        database=Config.DB_NAME      # which database to use
    )

