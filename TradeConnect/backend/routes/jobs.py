"""
/api/jobs — what tradespeople and juniors see as "available jobs".

Schema note: there is no separate job-posting table. Bookings are created
with a tradesperson_id already assigned (an employer chooses someone from
the browse page). So a tradesperson's "available jobs" feed is their
inbox of bookings still in `pending` status, awaiting their acceptance.
"""
from flask import Blueprint, request, jsonify
from routes._helpers import (
    get_db, login_required, current_user_id, current_user_type,
    get_tradesperson_id_for_user, iso,
)

jobs = Blueprint('jobs', __name__)


def _shape(row):
    return {
        'id':           row['booking_id'],
        'booking_id':   row['booking_id'],
        'title':        row['service_name'],
        'trade':        row.get('trade_type') or row.get('trade_category') or '',
        'city':         row.get('city') or '',
        'address':      row.get('address') or '',
        'budget':       float(row['quoted_price']) if row.get('quoted_price') is not None else None,
        'employer':     f"{row.get('emp_first','')} {row.get('emp_last','')}".strip(),
        'employer_id':  row.get('user_id'),
        'scheduled_at': iso(row.get('scheduled_at')),
        'created_at':   iso(row.get('created_at')),
    }


# ────────────────────────────────────────────────────────────
# GET /api/jobs/available
# Returns pending bookings assigned to the current tradesperson.
# Optional filter: ?q=search-term  (matches trade or city)
# ────────────────────────────────────────────────────────────
@jobs.route('/available', methods=['GET'])
@login_required
def available():
    if current_user_type() not in ('Tradesperson', 'Junior'):
        return jsonify({'jobs': []}), 200

    user_id = current_user_id()
    q = (request.args.get('q') or '').strip()

    db = get_db()
    cursor = db.cursor(dictionary=True)
    tp_id = get_tradesperson_id_for_user(cursor, user_id)
    if not tp_id:
        cursor.close(); db.close()
        return jsonify({'jobs': []}), 200

    sql = """
        SELECT b.booking_id, b.user_id, b.scheduled_at, b.created_at,
               b.city, b.address, b.quoted_price,
               s.service_name, s.trade_type,
               t.trade_category,
               eu.first_name AS emp_first, eu.last_name AS emp_last
        FROM bookings b
        JOIN services s   ON s.service_id = b.service_id
        JOIN tradespeople t ON t.tradesperson_id = b.tradesperson_id
        JOIN users    eu  ON eu.user_id = b.user_id
        WHERE b.tradesperson_id = %s AND b.status = 'pending'
    """
    params = [tp_id]
    if q:
        sql += " AND (s.trade_type LIKE %s OR t.trade_category LIKE %s OR b.city LIKE %s)"
        like = f"%{q}%"
        params.extend([like, like, like])
    sql += " ORDER BY b.created_at DESC"

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    cursor.close(); db.close()

    return jsonify({'jobs': [_shape(r) for r in rows]}), 200


# ────────────────────────────────────────────────────────────
# GET /api/jobs/cap   — Junior page job-cap progress bar
# Returns { job_limit, jobs_taken, remaining }
# Counts non-cancelled, non-completed bookings as "taken".
# ────────────────────────────────────────────────────────────
@jobs.route('/cap', methods=['GET'])
@login_required
def cap():
    if current_user_type() not in ('Tradesperson', 'Junior'):
        return jsonify({'error': 'Not applicable'}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    user_id = current_user_id()
    tp_id = get_tradesperson_id_for_user(cursor, user_id)
    if not tp_id:
        cursor.close(); db.close()
        return jsonify({'job_limit': 0, 'jobs_taken': 0, 'remaining': 0}), 200

    cursor.execute(
        "SELECT job_limit FROM tradespeople WHERE tradesperson_id = %s",
        (tp_id,),
    )
    job_limit = cursor.fetchone()['job_limit']

    cursor.execute(
        """SELECT COUNT(*) AS taken FROM bookings
           WHERE tradesperson_id = %s AND status IN ('pending','accepted','in_progress')""",
        (tp_id,),
    )
    taken = cursor.fetchone()['taken']
    cursor.close(); db.close()

    return jsonify({
        'job_limit': job_limit,
        'jobs_taken': taken,
        'remaining': max(0, job_limit - taken),
    }), 200


# POST /api/jobs/<booking_id>/apply  — convenience alias for "accept"
@jobs.route('/<int:booking_id>/apply', methods=['POST'])
@login_required
def apply_to_job(booking_id):
    if current_user_type() not in ('Tradesperson', 'Junior'):
        return jsonify({'error': 'Forbidden'}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)
    user_id = current_user_id()
    tp_id = get_tradesperson_id_for_user(cursor, user_id)

    cursor.execute(
        "SELECT tradesperson_id, status FROM bookings WHERE booking_id = %s",
        (booking_id,),
    )
    row = cursor.fetchone()
    if not row:
        cursor.close(); db.close()
        return jsonify({'error': 'Booking not found'}), 404
    if row['tradesperson_id'] != tp_id:
        cursor.close(); db.close()
        return jsonify({'error': 'This job is not assigned to you'}), 403
    if row['status'] != 'pending':
        cursor.close(); db.close()
        return jsonify({'error': f"Cannot accept: status is {row['status']}"}), 400

    try:
        cursor.execute(
            "UPDATE bookings SET status='accepted' WHERE booking_id=%s",
            (booking_id,),
        )
        db.commit()
    except Exception as e:
        cursor.close(); db.close()
        return jsonify({'error': str(e)}), 400

    cursor.close(); db.close()
    return jsonify({'message': 'Job accepted'}), 200
