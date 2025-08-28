import os
from flask import Flask, request, jsonify
from models import db, EventRegistration
from email_utils import send_registration_email
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure MySQL database using environment variable
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DB_URI")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize DB with Flask app
db.init_app(app)


@app.route("/")
def home():
    """
    Home route to verify the server is running.
    """
    return "<h2>QR Check-in App Running 🚀</h2><a href='/scanner'>Go to Scanner</a>"


@app.route("/scanner")
def scanner():
    """
    Render the QR scanner HTML page.
    """
    return app.send_static_file("scanner.html")


@app.route("/register", methods=["POST"])
def register_user():
    """
    API endpoint to register a user for an event.
    - Saves registration in the database.
    - Sends a confirmation email with QR code.
    """
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        user_name = data.get("user_name")
        user_email = data.get("user_email")
        event_id = data.get("event_id")
        event_name = data.get("event_name")

        # Generate QR code (simple format: userID-eventID)
        qr_code = f"{user_id}-{event_id}"

        # Save registration in DB
        new_registration = EventRegistration(
            user_id=user_id,
            event_id=event_id,
            qr_code=qr_code,
            checked_in=False
        )
        db.session.add(new_registration)
        db.session.commit()

        # Send confirmation email
        email_sent = send_registration_email(
            to_email=user_email,
            user_name=user_name,
            event_name=event_name,
            qr_code=qr_code
        )

        if email_sent:
            return jsonify({
                "status": "success",
                "message": f"✅ Registration confirmed and email sent to {user_email}",
                "qr_code": qr_code
            }), 200
        else:
            return jsonify({
                "status": "warning",
                "message": "⚠️ Registered successfully, but failed to send email.",
                "qr_code": qr_code
            }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"❌ Registration failed: {str(e)}"
        }), 500


@app.route("/validate_qr", methods=["POST"])
def validate_qr():
    """
    API endpoint to validate a QR code at check-in.
    - Verifies if QR exists in the database.
    - Checks if already used.
    - Marks as checked-in if valid.
    """
    try:
        data = request.get_json()
        qr_data = data.get("qr_data")

        # Try to parse QR content as key=value&key2=value2
        try:
            params = dict(x.split("=") for x in qr_data.split("&"))
            user_id = params.get("user_id")
            event_id = params.get("event_id")
        except Exception:
            user_id, event_id = None, None

        # Query DB
        query = None
        if user_id and event_id:
            query = EventRegistration.query.filter_by(user_id=user_id, event_id=event_id).first()
        else:
            query = EventRegistration.query.filter_by(qr_code=qr_data).first()

        # Validate QR existence
        if not query:
            return jsonify({"status": "error", "message": "❌ QR not found"}), 404

        # Validate if already checked-in
        if query.checked_in:
            return jsonify({"status": "error", "message": "⚠️ QR already used"}), 400

        # Mark check-in
        query.checked_in = True
        query.checkin_time = datetime.now()
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": f"✅ Check-in successful for user {query.user_id}"
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"❌ Check-in failed: {str(e)}"
        }), 500


if __name__ == "__main__":
    # Run Flask development server
    app.run(debug=True)
