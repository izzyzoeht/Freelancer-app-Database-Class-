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
    ws1.append(['Month', 'Number of Payments', 'Total Revenue'])
    for row in monthly_data:
        # Force month to be a string so Excel doesn't try to parse it as a date
        ws1.append([str(row['month']), int(row['num_payments']), float(row['total_revenue'])])

    ws1.column_dimensions['A'].width = 12
    ws1.column_dimensions['B'].width = 22
    ws1.column_dimensions['C'].width = 18

    if monthly_data:
        n = len(monthly_data)

        chart1 = LineChart()
        chart1.title = "Monthly Revenue Trend"
        chart1.y_axis.title = "Revenue ($)"
        chart1.x_axis.title = "Month"
        chart1.width = 18
        chart1.height = 10
        chart1.legend = None  # only one series, legend is noise

        # Data: ONLY column C (Total Revenue), rows 1 (header) through n+1
        data = Reference(ws1, min_col=3, max_col=3, min_row=1, max_row=n+1)
        chart1.add_data(data, titles_from_data=True)

        # Categories: column A (Month), rows 2 through n+1 (skip header)
        cats = Reference(ws1, min_col=1, max_col=1, min_row=2, max_row=n+1)
        chart1.set_categories(cats)

        ws1.add_chart(chart1, "F2")

    # ---- Sheet 2: Revenue by City ----
    ws2 = wb.create_sheet("Revenue by City")
    ws2.append(['City', 'Bookings', 'Revenue'])
    for row in city_data:
        ws2.append([str(row['city']), int(row['bookings']), float(row['revenue'])])

    ws2.column_dimensions['A'].width = 20
    ws2.column_dimensions['B'].width = 12
    ws2.column_dimensions['C'].width = 14

    if city_data:
        n = len(city_data)

        chart2 = BarChart()
        chart2.title = "Revenue by City"
        chart2.y_axis.title = "Revenue ($)"
        chart2.x_axis.title = "City"
        chart2.width = 18
        chart2.height = 10
        chart2.legend = None

        data = Reference(ws2, min_col=3, max_col=3, min_row=1, max_row=n+1)
        chart2.add_data(data, titles_from_data=True)

        cats = Reference(ws2, min_col=1, max_col=1, min_row=2, max_row=n+1)
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
