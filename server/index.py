from flask import Flask, request, jsonify
from flask_cors import CORS
import qrcode
import os
import uuid
from database import create_connection
from datetime import datetime

connection = create_connection()

app = Flask(__name__)
CORS(app)

QR_FOLDER = 'qr_codes'
os.makedirs(QR_FOLDER, exist_ok=True)

@app.route('/api/event/register_user', methods=['POST'])
def register_user_events():
    """
    Register a user for an event:
    - Generates a unique QR code.
    - Saves it to the database.
    - Returns the path of the generated QR code.
    """
    cursor = None
    try:
        data = request.json
        user_id = data.get("user_id")
        event_id = data.get("event_id")

        if not user_id or not event_id:
            return jsonify({"error": "Faltan datos obligatorios"}), 400

        # Generar QR único (ej: user-event-uuid)
        qr_code = f"{user_id}-{event_id}-{uuid.uuid4()}"
        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(QR_FOLDER, filename)

        # Crear imagen QR
        img = qrcode.make(qr_code)
        img.save(filepath)

        # Guardar en la BD
        cursor = connection.cursor()
        sql = """
        INSERT INTO event_registrations (user_id, event_id, qr_code, checked_in, registration_time)
        VALUES (%s, %s, %s, %s, %s)
        """
        values = (user_id, event_id, qr_code, False, datetime.now())
        cursor.execute(sql, values)
        connection.commit()
        cursor.close()

        return jsonify({
            "status": "success",
            "message": "✅ Usuario registrado con éxito",
            "qr_code": qr_code,
            "qr_path": filepath
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/validate_qr', methods=['POST'])
def validate_qr():
    """
    Valida un QR en el check-in:
    - Verifica si existe en la BD.
    - Revisa si ya fue usado.
    - Marca la entrada si es válido.
    """
    cursor = None
    try:
        data = request.json
        qr_data = data.get("qr_code")

        if not qr_data:
            return jsonify({"error": "No se recibió código QR"}), 400

        cursor = connection.cursor(dictionary=True)
        sql = "SELECT * FROM event_registrations WHERE qr_code = %s"
        cursor.execute(sql, (qr_data,))
        record = cursor.fetchone()

        if not record:
            cursor.close()
            return jsonify({"status": "error", "message": "❌ QR no encontrado"}), 404

        if record["checked_in"]:
            cursor.close()
            return jsonify({"status": "error", "message": "⚠️ QR ya fue usado"}), 400

        # Actualizar a check-in hecho
        update_sql = """
        UPDATE event_registrations
        SET checked_in = %s, checkin_time = %s
        WHERE qr_code = %s
        """
        cursor.execute(update_sql, (True, datetime.now(), qr_data))
        connection.commit()
        cursor.close()

        return jsonify({
            "status": "success",
            "message": f"✅ Check-in exitoso para usuario {record['user_id']}"
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/register', methods=['POST'])
def register_user():
    """
    Register a new user.
    """
    cursor = None
    try:
        data = request.json
        full_name = data.get('full_name')
        email = data.get('email')
        role = data.get('role')
        password = data.get('password')

        cursor = connection.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({'error': 'User already exists'}), 400

        cursor.execute("INSERT INTO users (full_name, email, password, id_role) VALUES (%s, %s, %s, %s)",
                       (full_name, email, password, role))

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
    """
    Login a user. if the user exists in the database, return a success message.
    else return an error message.
    """
    cursor = None
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        cursor = connection.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s AND is_active = TRUE", (email, password))
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

@app.route('/api/user/<int:id_user>', methods=['GET'])
def get_user(id_user):
    """
    Get user information by user ID. receive user ID as a path parameter.
    and return user information.
    """
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM users WHERE id = %s AND is_active = TRUE", (id_user,))
        user = cursor.fetchone()
        if user:
            return jsonify({'id': user[0], 'full_name': user[1], 'email': user[2], 'role': user[3]}), 200
        else:
            return jsonify({'error': 'User not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/users', methods=['GET'])
def get_all_users():
    """
    Get a list of all users.
    """
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM users WHERE is_active = TRUE")
        users = cursor.fetchall()
        return jsonify([{'id': user[0], 'full_name': user[1], 'email': user[2], 'role': user[3]} for user in users]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/user/<int:id_user>', methods=['PATCH'])
def update_user(id_user):
    """
    Update user information by user ID. receive the user ID as a path 
    parameter and the updated data in the request body.
    """
    cursor = None
    try:
        data = request.json
        email = data.get('email')
        role = data.get('role')
        password = data.get('password')

        cursor = connection.cursor()
        cursor.execute("UPDATE users SET email = %s, role = %s, password = %s WHERE id = %s AND is_active = TRUE",
                       (email, role, password, id_user))

        user = cursor.fetchone()
        if user:
            connection.commit()
            return jsonify({'message': 'User updated successfully'}), 200

        return jsonify({'error': 'User not found'}), 404

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/user/<int:id_user>', methods=['PATCH'])
def delete_user(id_user):
    """
    Delete a user by user ID. receive user ID as a path parameter.
    """
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute("UPDATE users SET is_active = FALSE WHERE id = %s", (id_user,))
        connection.commit()

        return jsonify({'message': 'User deleted successfully'}), 200

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/events', methods=['GET'])
def get_events():
    """
    Get a list of all events.
    """
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute("""
                        SELECT 
                            e.name,
                            e.date_time,
                            e.capacity,
                            e.description,
                            c.name,
                            l.name,
                            l.address
                        FROM 
                            events e
                        JOIN category c ON e.id_category = c.id
                        JOIN location l ON e.id_location = l.id
                        """)
        events = cursor.fetchall()

        if events is None:
            return jsonify({'error': 'No events exist'}), 404

        return jsonify([{
            'name': event[0],
            'date_time': event[1],
            'capacity': event[2],
            'description': event[3],
            'category': event[4],
            'location': event[5],
            'address': event[6]
        } for event in events]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/event/<int:id_event>', methods=['GET'])
def get_event(id_event):
    """
    Get event details by event ID.
    """
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute("""
                        SELECT 
                            e.name,
                            e.date_time,
                            e.capacity,
                            e.description,
                            c.name,
                            l.name,
                            l.address
                        FROM 
                            events e
                        JOIN category c ON e.id_category = c.id
                        JOIN location l ON e.id_location = l.id
                        WHERE e.id = %s
                        """, (id_event,))
        event = cursor.fetchone()

        if event is None:
            return jsonify({'error': 'Event not found'}), 404

        return jsonify({
            'name': event[0],
            'date_time': event[1],
            'capacity': event[2],
            'description': event[3],
            'category': event[4],
            'location': event[5],
            'address': event[6]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/event/<int:id_event>', methods=['PATCH'])
def update_event(id_event):
    """
    Update an event by event ID.
    """
    data = request.get_json()
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute("""
                        UPDATE events
                            SET name = %s, 
                            date_time = %s,
                            capacity = %s,
                            description = %s,
                            id_category = %s,
                            id_location = %s
                        WHERE id = %s
                        """, (data['name'], data['date_time'], data['capacity'], data['description'], data['id_category'], data['id_location'], id_event))
        connection.commit()

        return jsonify({'message': 'Event updated successfully'}), 200

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/event/<int:id_event>', methods=['DELETE'])
def delete_event(id_event):
    """
    Delete an event by event ID.
    """
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute("""
                        DELETE FROM events
                        WHERE id = %s
                        """, (id_event,))
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Event not found'}), 404

        return jsonify({'message': 'Event deleted successfully'}), 200

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/event', methods=['POST'])
def create_event():
    """
    Create a new event.
    """
    data = request.get_json()
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute("""
                        INSERT INTO events (name, date_time, capacity, description, id_category, id_location)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """, (data['name'], data['date_time'], data['capacity'], data['description'], data['id_category'], data['id_location']))
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Event could not be created'}), 400

        return jsonify({'message': 'Event created successfully'}), 201

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/ticket/create', methods=['POST'])
def create_ticket():
    """
    Create a new ticket. Requires event ID, user ID, quantity, and QR code.
    """
    data = request.get_json()
    cursor = None
    try:
        cursor = connection.cursor()
        cursor.execute("""
                        INSERT INTO tickets (id_event, id_user, quantity, QR)
                        VALUES (%s, %s, %s, %s)
                        """, (data['id_event'], data['id_user'], data['quantity'], data['QR']))
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Ticket could not be created'}), 400

        return jsonify({'message': 'Ticket created successfully'}), 201

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

if __name__ == '__main__':
    app.run(debug=True)