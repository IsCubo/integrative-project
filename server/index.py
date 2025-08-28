from flask import Flask, request, jsonify
from flask_cors import CORS
import qrcode
import os
import uuid
from database import create_connection

connection = create_connection()

app = Flask(__name__)
CORS(app)

QR_FOLDER = 'qr_codes'
os.makedirs(QR_FOLDER, exist_ok=True)


@app.route('/api/generate_qr', methods=['POST'])
def generate_qr():
    """
    Generate a QR code from the provided text.
    Then save it to a file and return the file path.
    """
    try:
        data = request.json
        text = data.get('text')
        if not text:
            return jsonify({'error': 'No text provided'}), 400

        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(QR_FOLDER, filename)
        img = qrcode.make(text)
        img.save(filepath)

        return jsonify({'qr_path': filepath})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/user/register', methods=['POST'])
def register_user():
    """
    Register a new user.
    """
    cursor = None
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        role = data.get('role')
        password = data.get('password')

        cursor = connection.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({'error': 'User already exists'}), 400

        cursor.execute("INSERT INTO users (username, email, role, password) VALUES (%s, %s, %s, %s)",
                       (username, email, role, password))
        connection.commit()

        return jsonify({'message': 'User registered successfully'}), 201

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/user/login', methods=['POST'])
def login_user():
    cursor = None
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        cursor = connection.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
        user = cursor.fetchone()
        if user:
            return jsonify({'message': 'Login successful'}), 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()



if __name__ == '__main__':
    app.run(debug=True)