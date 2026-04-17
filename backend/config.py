import os
# read .env file
from dotenv import load_dotenv

load_dotenv()


class Config: 
    # clas holdes all app settings in one place
    # organized and easy to import anywhere in app

    SECRET_KEY = os.getenv('SECRET_KEY' , 'dev-secret-key')
    #secret key for sessions
   # detailed error while building 
    DEBUG = True

    # Database setting-  need more database info after
    DB_HOST = os.getenv('DB_HOST', 'localhost')
  #which computer MySQL is running on 
   #MySQl username 
    DB_USER = os.getenv('DB_USER','root')
  #MySql password
    DB_PASSWORD = os.getenv('DB-PASSWORD','')
# Mysql  name
    DB_name = os.getenv('DB_NAME', 'freelancer_db')
