"""
/api/tradespeople — search, single profile, upsert.
Powers: employer browse page, profile (Trade Profile section),
junior endorsement lookup.
"""
from flask import Blueprint, request, jsonify, session
from routes._helpers import (
    get_db, login_required, current_user_id, current_user_type, iso,
)

tradespeople = Blueprint('tradespeople', __name__)


def _serialize_tp(row):
    """Build a TradespersonWithUser dict matching the frontend type."""
    return {
        'tradesperson_id': row['tradesperson_id'],
        'user_id':         row['user_id'],
        'trade_category':  row['trade_category'],
        'license_number':  row.get('license_number'),
        'license_state':   row.get('license_state'),
        'license_expiry':  iso(row.get('license_expiry')),
        'experience_year': row['experience_year'],
        'endorse_id':      row.get('endorse_id'),
        'job_limit':       row['job_limit'],
        'avg_rating':      float(row['avg_rating']) if row.get('avg_rating') is not None else 0.0,
        'is_verified':     bool(row['is_verified']),
        'user': {
            'user_id':    row['user_id'],
            'first_name': row['first_name'],
            'last_name':  row['last_name'],
            'email':      row['email'],
            'phone':      row.get('phone'),
            'city':       row.get('city'),
            'state':      row.get('state'),
            'user_type':  row['user_type'],
            'is_active':  bool(row.get('is_active', True)),
            'created_at': iso(row.get('user_created_at')) or '',
        },
    }


# ────────────────────────────────────────────────────────────
# GET /api/tradespeople   ?trade_category=Plumbing&city=NYC
# Used by: employer browse page
# Excludes juniors (endorse_id IS NULL) so employers only see
# main tradespeople (consistent with DB triggers).
# ────────────────────────────────────────────────────────────
@tradespeople.route('', methods=['GET'])
@tradespeople.route('/', methods=['GET'])
def search():
    trade_category = request.args.get('trade_category')
    city           = request.args.get('city')

    sql = """
        SELECT t.*,
               u.first_name, u.last_name, u.email, u.phone,
               u.city, u.state, u.user_type, u.is_active,
               u.created_at AS user_created_at
        FROM tradespeople t
        JOIN users u ON u.user_id = t.user_id
        WHERE u.is_active = TRUE
          AND t.endorse_id IS NULL
    """
    params = []
    if trade_category and trade_category.lower() != 'all':
        sql += " AND t.trade_category = %s"
        params.append(trade_category)
    if city:
        sql += " AND u.city LIKE %s"
        params.append(f"%{city}%")
    sql += " ORDER BY t.avg_rating DESC, t.experience_year DESC"

    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(sql, params)
    rows = cursor.fetchall()

    # Attach a flat services preview for each tradesperson (used on browse cards)
    for row in rows:
        cursor.execute(
            """SELECT service_name FROM services
               WHERE tradesperson_id = %s LIMIT 5""",
            (row['tradesperson_id'],),
        )
        names = [r['service_name'] for r in cursor.fetchall()]
        row['_services'] = names

    cursor.close(); db.close()

    result = []
    for r in rows:
        item = _serialize_tp(r)
        item['service_names'] = ', '.join(r['_services']) if r['_services'] else ''
        result.append(item)

    return jsonify({'tradespeople': result}), 200


# ────────────────────────────────────────────────────────────
# GET /api/tradespeople/<int:tp_id>
# ────────────────────────────────────────────────────────────
@tradespeople.route('/<int:tp_id>', methods=['GET'])
def get_one(tp_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """SELECT t.*,
                  u.first_name, u.last_name, u.email, u.phone,
                  u.city, u.state, u.user_type, u.is_active,
                  u.created_at AS user_created_at
           FROM tradespeople t
           JOIN users u ON u.user_id = t.user_id
           WHERE t.tradesperson_id = %s""",
        (tp_id,),
    )
    row = cursor.fetchone()

    if not row:
        cursor.close(); db.close()
        return jsonify({'error': 'Tradesperson not found'}), 404

    # Attach services
    cursor.execute(
        "SELECT * FROM services WHERE tradesperson_id = %s",
        (tp_id,),
    )
    services = cursor.fetchall()
    cursor.close(); db.close()

    out = _serialize_tp(row)
    out['services'] = [{
        'service_id':      s['service_id'],
        'tradesperson_id': s['tradesperson_id'],
        'service_name':    s['service_name'],
        'description':     s.get('description'),
        'hourly_rate':     float(s['hourly_rate']) if s.get('hourly_rate') is not None else None,
        'trade_type':      s.get('trade_type'),
    } for s in services]

    return jsonify({'tradesperson': out}), 200


# ────────────────────────────────────────────────────────────
# GET /api/tradespeople/me  — current logged-in tradesperson
# Used by tradesperson dashboard for stats and rating display.
# ────────────────────────────────────────────────────────────
@tradespeople.route('/me', methods=['GET'])
@login_required
def get_me():
    user_id = current_user_id()
    if current_user_type() not in ('Tradesperson', 'Junior'):
        return jsonify({'error': 'Only tradespeople have a trade profile'}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """SELECT t.*,
                  u.first_name, u.last_name, u.email, u.phone,
                  u.city, u.state, u.user_type, u.is_active,
                  u.created_at AS user_created_at
           FROM tradespeople t
           JOIN users u ON u.user_id = t.user_id
           WHERE t.user_id = %s""",
        (user_id,),
    )
    row = cursor.fetchone()
    cursor.close(); db.close()

    if not row:
        return jsonify({'error': 'No trade profile found'}), 404

    return jsonify({'tradesperson': _serialize_tp(row)}), 200


# ────────────────────────────────────────────────────────────
# POST /api/tradespeople/profile — create/update trade profile
# Used by Profile page (Trade Profile section).
# ────────────────────────────────────────────────────────────
@tradespeople.route('/profile', methods=['POST'])
@login_required
def upsert_profile():
    if current_user_type() not in ('Tradesperson', 'Junior'):
        return jsonify({'error': 'Only tradespeople can update a trade profile'}), 403

    user_id = current_user_id()
    data = request.get_json(force=True)

    trade_category  = data.get('trade_category')
    license_number  = data.get('license_number')
    license_state   = data.get('license_state')
    license_expiry  = data.get('license_expiry') or None  # 'YYYY-MM-DD'
    experience_year = data.get('experience_year', 0)

    if not trade_category:
        return jsonify({'error': 'trade_category is required'}), 400

    db = get_db()
    cursor = db.cursor()

    # Check if a tradespeople row already exists
    cursor.execute(
        "SELECT tradesperson_id FROM tradespeople WHERE user_id = %s",
        (user_id,),
    )
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            """UPDATE tradespeople
               SET trade_category=%s, license_number=%s, license_state=%s,
                   license_expiry=%s, experience_year=%s
               WHERE user_id = %s""",
            (trade_category, license_number, license_state, license_expiry,
             experience_year, user_id),
        )
    else:
        cursor.execute(
            """INSERT INTO tradespeople
               (user_id, trade_category, license_number, license_state,
                license_expiry, experience_year)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (user_id, trade_category, license_number, license_state,
             license_expiry, experience_year),
        )
    db.commit()
    cursor.close(); db.close()

    return jsonify({'message': 'Trade profile saved'}), 200


# ────────────────────────────────────────────────────────────
# POST /api/tradespeople/endorse  — junior asks for endorsement by email
# Body: { supervisor_email: string }
# Sets the junior's endorse_id to the supervisor's tradesperson_id.
# Used by Junior setup page.
# ────────────────────────────────────────────────────────────
@tradespeople.route('/endorse', methods=['POST'])
@login_required
def endorse_request():
    if current_user_type() != 'Junior':
        return jsonify({'error': 'Only Juniors can request endorsement'}), 403

    data = request.get_json(force=True)
    supervisor_email = (data.get('supervisor_email') or '').strip().lower()
    if not supervisor_email:
        return jsonify({'error': 'supervisor_email is required'}), 400

    user_id = current_user_id()
    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Look up supervisor: must be a Tradesperson (not Junior, not Employer)
    cursor.execute(
        """SELECT t.tradesperson_id, u.user_type
           FROM users u JOIN tradespeople t ON t.user_id = u.user_id
           WHERE LOWER(u.email) = %s""",
        (supervisor_email,),
    )
    sup = cursor.fetchone()
    if not sup:
        cursor.close(); db.close()
        return jsonify({'error': 'Supervisor not found'}), 404
    if sup['user_type'] != 'Tradesperson':
        cursor.close(); db.close()
        return jsonify({'error': 'Supervisor must be a senior Tradesperson'}), 400

    cursor.execute(
        "UPDATE tradespeople SET endorse_id = %s WHERE user_id = %s",
        (sup['tradesperson_id'], user_id),
    )
    db.commit()
    cursor.close(); db.close()

    return jsonify({
        'message': 'Endorsement request linked',
        'supervisor_tradesperson_id': sup['tradesperson_id'],
    }), 200
