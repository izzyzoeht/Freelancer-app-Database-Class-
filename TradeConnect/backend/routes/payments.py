"""
/api/payments — record a payment for a booking, fetch payment for a booking.
"""
from flask import Blueprint, request, jsonify
from routes._helpers import (
    get_db, login_required, current_user_id, current_user_type, iso,
)

payments = Blueprint('payments', __name__)

METHODS  = {'card', 'cash', 'online'}
STATUSES = {'pending', 'paid', 'failed'}


def _serialize(p):
    return {
        'payment_id': p['payment_id'],
        'booking_id': p['booking_id'],
        'amount':     float(p['amount']),
        'method':     p['method'],
        'status':     p['status'],
        'paid_at':    iso(p.get('paid_at')),
    }


# GET /api/payments/booking/<id>
@payments.route('/booking/<int:booking_id>', methods=['GET'])
@login_required
def get_for_booking(booking_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM payments WHERE booking_id = %s",
        (booking_id,),
    )
    row = cursor.fetchone()
    cursor.close(); db.close()

    if not row:
        return jsonify({'payment': None}), 200
    return jsonify({'payment': _serialize(row)}), 200


# POST /api/payments  — Employer pays
# Body: { booking_id, amount, method }
@payments.route('', methods=['POST'])
@payments.route('/', methods=['POST'])
@login_required
def create():
    if current_user_type() != 'Employer':
        return jsonify({'error': 'Only employers can record payments'}), 403

    data = request.get_json(force=True)
    booking_id = data.get('booking_id')
    amount     = data.get('amount')
    method     = data.get('method')

    if not booking_id or amount is None or method not in METHODS:
        return jsonify({'error': 'booking_id, amount, and valid method required'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Confirm booking belongs to this employer
    cursor.execute("SELECT user_id FROM bookings WHERE booking_id = %s", (booking_id,))
    row = cursor.fetchone()
    if not row:
        cursor.close(); db.close()
        return jsonify({'error': 'Booking not found'}), 404
    if row['user_id'] != current_user_id():
        cursor.close(); db.close()
        return jsonify({'error': 'Forbidden'}), 403

    # Upsert: one payment row per booking
    cursor.execute("SELECT payment_id FROM payments WHERE booking_id = %s", (booking_id,))
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            """UPDATE payments
               SET amount=%s, method=%s, status='paid', paid_at=CURRENT_TIMESTAMP
               WHERE booking_id=%s""",
            (amount, method, booking_id),
        )
    else:
        cursor.execute(
            """INSERT INTO payments (booking_id, amount, method, status, paid_at)
               VALUES (%s, %s, %s, 'paid', CURRENT_TIMESTAMP)""",
            (booking_id, amount, method),
        )
    db.commit()
    cursor.close(); db.close()

    return jsonify({'message': 'Payment recorded'}), 201
