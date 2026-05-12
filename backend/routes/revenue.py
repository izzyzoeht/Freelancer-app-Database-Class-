"""
/api/revenue - rev summary for model
"""
from flask import Blueprint, jsonify, send_file
from routes._helpers import get_db, login_required, current_user_type
from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.chart.axis import ChartLines
from io import BytesIO
from datetime import datetime

revenue = Blueprint('revenue', __name__)

@revenue.route('/summary', methods=['GET'])
@login_required
def summary():
    # Only Admin users may view the platform-wide revenue summary.
    if current_user_type() != 'Admin':
        return jsonify({'error': 'Only admins can view the revenue summary'}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT COALESCE(SUM(amount), 0) AS total_payment_volume FROM payments WHERE status='paid'"
    )
    total_payment_volume = cursor.fetchone()['total_payment_volume']

    cursor.execute("SELECT COALESCE(SUM(fee_amount), 0) AS total_platform_fees FROM platform_fees")
    total_platform_fees = cursor.fetchone()['total_platform_fees']

    cursor.execute(
        """SELECT COUNT(*) AS active_subscriptions,
                  COALESCE(SUM(price_at_purchase), 0) AS monthly_subscription_revenue
             FROM subscriptions
            WHERE status='active'"""
    )
    subs = cursor.fetchone()

    cursor.execute(
        """SELECT rs.stream_name,
                  COALESCE(SUM(pf.fee_amount), 0) AS revenue
             FROM revenue_streams rs
             LEFT JOIN platform_fees pf ON pf.revenue_stream_id = rs.revenue_stream_id
            GROUP BY rs.revenue_stream_id, rs.stream_name
            ORDER BY rs.stream_name"""
    )
    streams = cursor.fetchall()

    cursor.close(); db.close()

    total_estimated_revenue = total_platform_fees + subs['monthly_subscription_revenue']
    return jsonify({
        'total_payment_volume': float(total_payment_volume),
        'total_platform_fees': float(total_platform_fees),
        'active_subscriptions': int(subs['active_subscriptions']),
        'monthly_subscription_revenue': float(subs['monthly_subscription_revenue']),
        'total_estimated_revenue': float(total_estimated_revenue),
        'streams': [
            {'stream_name': r['stream_name'], 'revenue': float(r['revenue'])}
            for r in streams
        ],
    }), 200

@revenue.route('/export', methods=['GET'])
@login_required
def export_excel():
    if current_user_type() != 'Admin':
        return jsonify({'error': 'Only admins can export the revenue report'}), 403

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT DATE_FORMAT(paid_at, '%Y-%m') AS month,
     	          COUNT(*) AS num_payments,
               SUM(amount) AS total_revenue
        FROM payments
        WHERE status='paid'
        GROUP BY month
        ORDER BY month
    """)
    monthly_data = cursor.fetchall()

    cursor.execute("""
        SELECT b.city, COUNT(*) AS bookings, SUM(p.amount) AS revenue
        FROM bookings b
        JOIN payments p ON b.booking_id = p.booking_id
        WHERE p.status='paid'
        GROUP BY b.city
        ORDER BY revenue DESC
    """)
    city_data = cursor.fetchall()

    cursor.close(); db.close()

    wb = Workbook()

    # ---- Sheet 1: Monthly Revenue ----
    ws1 = wb.active
    ws1.title = "Monthly Revenue"
    ws1.append([str(row['month']), int(row['num_payments']), float(row['total_revenue'])])
    for row in monthly_data:
        ws1.append([row['month'], row['num_payments'], float(row['total_revenue'])])

    ws1.column_dimensions['A'].width = 12
    ws1.column_dimensions['B'].width = 22
    ws1.column_dimensions['C'].width = 18

    if monthly_data:
        chart1 = LineChart()
        chart1.title = "Monthly Revenue Trend"
        chart1.y_axis.title = "Revenue ($)"
        chart1.x_axis.title = "Month"
        chart1.width = 18
        chart1.height = 10

        data = Reference(ws1, min_col=3, min_row=1, max_row=len(monthly_data)+1)
        cats = Reference(ws1, min_col=1, min_row=2, max_row=len(monthly_data)+1)
        chart1.add_data(data, titles_from_data=True)
        chart1.set_categories(cats)

        chart1.x_axis.delete = False
        chart1.y_axis.delete = False
        chart1.x_axis.lblAlgn = "ctr"
        chart1.x_axis.lblOffset = 100

        ws1.add_chart(chart1, "F2")

    # ---- Sheet 2: Revenue by City ----
    ws2 = wb.create_sheet("Revenue by City")
    ws2.append(['City', 'Bookings', 'Revenue'])
    for row in city_data:
        ws2.append([row['city'], row['bookings'], float(row['revenue'])])

    ws2.column_dimensions['A'].width = 20
    ws2.column_dimensions['B'].width = 12
    ws2.column_dimensions['C'].width = 14

    if city_data:
        chart2 = BarChart()
        chart2.title = "Revenue by City"
        chart2.y_axis.title = "Revenue ($)"
        chart2.x_axis.title = "City"
        chart2.width = 18
        chart2.height = 10

        data = Reference(ws2, min_col=3, min_row=1, max_row=len(city_data)+1)
        cats = Reference(ws2, min_col=1, min_row=2, max_row=len(city_data)+1)
        chart2.add_data(data, titles_from_data=True)
        chart2.set_categories(cats)

        ws2.add_chart(chart2, "F2")

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"tradeconnect_revenue_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return send_file(
        buffer,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )
