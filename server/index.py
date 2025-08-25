from flask import Flask, request, jsonify
from flask_cors import CORS
import qrcode
import os
import uuid

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
    

# @app.route('/api/user/register', methods=['POST'])
# def register_user():
#     """
#     Register a new user.
#     """
#     try:
#         data = request.json
#         username = data.get('username')
#         email = data.get('email')
#         role = data.get('role')
#         password = data.get('password')

#         if not username or not password:
#             return jsonify({'error': 'Username and password are required'}), 400

#         return jsonify({'message': 'User registered successfully'}), 201
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)