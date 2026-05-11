from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')

app.config.update(
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=True,
)

CORS(
    app,
    origins=["http://localhost:3000"],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)

# ── Register blueprints ─────────────────────────────────────
from routes.auth          import auth
from routes.users         import users
from routes.tradespeople  import tradespeople
from routes.services      import services
from routes.bookings      import bookings
from routes.payments      import payments
from routes.reviews       import reviews
from routes.notifications import notifications
from routes.jobs          import jobs

app.register_blueprint(auth,          url_prefix='/api/auth')
app.register_blueprint(users,         url_prefix='/api/users')
app.register_blueprint(tradespeople,  url_prefix='/api/tradespeople')
app.register_blueprint(services,      url_prefix='/api/services')
app.register_blueprint(bookings,      url_prefix='/api/bookings')
app.register_blueprint(payments,      url_prefix='/api/payments')
app.register_blueprint(reviews,       url_prefix='/api/reviews')
app.register_blueprint(notifications, url_prefix='/api/notifications')
app.register_blueprint(jobs,          url_prefix='/api/jobs')


@app.route('/')
def home():
    return jsonify({"message": "Freelancer API is running!"})


@app.route('/api/health')
def health():
    return jsonify({"status": "ok"})


if __name__ == '__main__':
    app.run(debug=True, port=5001)
