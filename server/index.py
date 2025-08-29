from flask import Flask, request, jsonify
from flask_cors import CORS
import qrcode
import os
import uuid
from database import create_connection
from datetime import datetime
from flasgger import Swagger, swag_from

connection = create_connection()

app = Flask(__name__)
swagger = Swagger(app)
CORS(app)

QR_FOLDER = 'qr_codes'
os.makedirs(QR_FOLDER, exist_ok=True)

@app.route('/api/event/register_user', methods=['POST'])
def register_user_events():
    """Register a user for an event.
    ---
    summary: Register a user for an event and generate a QR code
    tags:
      - Event Registration
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            user_id:
              type: integer
              example: 123
            event_id:
              type: integer
              example: 456
    responses:
      200:
        description: User registered successfully, QR code generated
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            message:
              type: string
              example: "✅ Usuario registrado con éxito"
            qr_code:
              type: string
              example: "123-456-uuid"
            qr_path:
              type: string
              example: "qr_codes/uuid.png"
      400:
        description: Missing required data
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Faltan datos obligatorios"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "Database error"
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
    """Validate a QR code at event check-in.
    ---
    summary: Validate QR code for event check-in
    tags:
      - Event Registration
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            qr_code:
              type: string
              example: "123-456-uuid"
    responses:
      200:
        description: Check-in successful
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            message:
              type: string
              example: "✅ Check-in exitoso para usuario 123"
      400:
        description: QR already used or missing
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "⚠️ QR ya fue usado"
      404:
        description: QR not found
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "❌ QR no encontrado"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "Database error"
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
    """Register a new user.
    ---
    summary: Register a new user
    tags:
      - User
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            full_name:
              type: string
              example: "John Doe"
            email:
              type: string
              example: "john@example.com"
            role:
              type: integer
              example: 2
            password:
              type: string
              example: "password123"
    responses:
      201:
        description: User registered successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "User registered successfully"
      400:
        description: User already exists
        schema:
          type: object
          properties:
            error:
              type: string
              example: "User already exists"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
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
    """Login a user.
    ---
    summary: Login a user
    tags:
      - User
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
              example: "john@example.com"
            password:
              type: string
              example: "password123"
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Login successful"
      401:
        description: Invalid email or password
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Invalid email or password"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
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
    """Get user information by user ID.
    ---
    summary: Get user information by user ID
    tags:
      - User
    parameters:
      - in: path
        name: id_user
        type: integer
        required: true
        example: 123
    responses:
      200:
        description: User information
        schema:
          type: object
          properties:
            id:
              type: integer
              example: 123
            full_name:
              type: string
              example: "John Doe"
            email:
              type: string
              example: "john@example.com"
            role:
              type: integer
              example: 2
      404:
        description: User not found
        schema:
          type: object
          properties:
            error:
              type: string
              example: "User not found"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
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
    """Get a list of all users.
    ---
    summary: Get all users
    tags:
      - User
    responses:
      200:
        description: List of users
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
                example: 123
              full_name:
                type: string
                example: "John Doe"
              email:
                type: string
                example: "john@example.com"
              role:
                type: integer
                example: 2
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
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

@app.route('/api/user/<int:id_user>', methods=['PUT'])
def update_user(id_user):
    """Update user information.
    ---
    summary: Update user information
    tags:
      - User
    consumes:
      - application/json
    parameters:
      - in: path
        name: id_user
        type: integer
        required: true
        example: 123
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            full_name:
              type: string
              example: "John Doe"
            email:
              type: string
              example: "john@example.com"
            role:
              type: integer
              example: 2
    responses:
      200:
        description: User updated successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "User updated successfully"
      404:
        description: User not found
        schema:
          type: object
          properties:
            error:
              type: string
              example: "User not found"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
    """
    cursor = None
    try:
        data = request.json
        full_name = data.get('full_name')
        email = data.get('email')
        role = data.get('role')

        cursor = connection.cursor()
        cursor.execute("UPDATE users SET full_name = %s, email = %s, role = %s WHERE id = %s AND is_active = TRUE",
                       (full_name, email, role, id_user))

        connection.commit()

        return jsonify({'message': 'User updated successfully'}), 200

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/user/<int:id_user>', methods=['DELETE'])
def delete_user(id_user):
    """Delete a user.
    ---
    summary: Delete a user
    tags:
      - User
    parameters:
      - in: path
        name: id_user
        type: integer
        required: true
        example: 123
    responses:
      200:
        description: User deleted successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "User deleted successfully"
      404:
        description: User not found
        schema:
          type: object
          properties:
            error:
              type: string
              example: "User not found"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
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
    """Get a list of all events.
    ---
    summary: Get all events
    tags:
      - Event
    responses:
      200:
        description: List of events
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
                example: 1
              name:
                type: string
                example: "Tech Conference"
              date:
                type: string
                example: "2024-09-15"
              description:
                type: string
                example: "Annual tech conference"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
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
    """Get event information by event ID.
    ---
    summary: Get event information by event ID
    tags:
      - Event
    parameters:
      - in: path
        name: id_event
        type: integer
        required: true
        example: 1
    responses:
      200:
        description: Event information
        schema:
          type: object
          properties:
            id:
              type: integer
              example: 1
            name:
              type: string
              example: "Tech Conference"
            date:
              type: string
              example: "2024-09-15"
            description:
              type: string
              example: "Annual tech conference"
      404:
        description: Event not found
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Event not found"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
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

@app.route('/api/event/<int:id_event>', methods=['PUT'])
def update_event(id_event):
    """Update event information.
    ---
    summary: Update event information
    tags:
      - Event
    consumes:
      - application/json
    parameters:
      - in: path
        name: id_event
        type: integer
        required: true
        example: 1
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
              example: "Tech Conference 2024"
            date:
              type: string
              example: "2024-09-16"
            description:
              type: string
              example: "The biggest tech conference"
    responses:
      200:
        description: Event updated successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Event updated successfully"
      404:
        description: Event not found
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Event not found"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
    """
    cursor = None
    try:
        data = request.json
        name = data.get('name')
        date_time = data.get('date_time')
        capacity = data.get('capacity')
        description = data.get('description')
        id_category = data.get('id_category')
        id_location = data.get('id_location')

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
                        """, (name, date_time, capacity, description, id_category, id_location, id_event))
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
    """Delete an event.
    ---
    summary: Delete an event
    tags:
      - Event
    parameters:
      - in: path
        name: id_event
        type: integer
        required: true
        example: 1
    responses:
      200:
        description: Event deleted successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Event deleted successfully"
      404:
        description: Event not found
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Event not found"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
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
    """Create a new event.
    ---
    summary: Create a new event
    tags:
      - Event
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
              example: "New Tech Conference"
            date:
              type: string
              example: "2024-10-20"
            description:
              type: string
              example: "A brand new tech conference"
    responses:
      201:
        description: Event created successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Event created successfully"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
    """
    cursor = None
    try:
        data = request.json
        name = data.get('name')
        date_time = data.get('date_time')
        capacity = data.get('capacity')
        description = data.get('description')
        id_category = data.get('id_category')
        id_location = data.get('id_location')

        cursor = connection.cursor()
        cursor.execute("""
                        INSERT INTO events (name, date_time, capacity, description, id_category, id_location)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """, (name, date_time, capacity, description, id_category, id_location))
        connection.commit()

        return jsonify({'message': 'Event created successfully'}), 201

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@app.route('/api/ticket', methods=['POST'])
def create_ticket():
    """Create a new ticket.
    ---
    summary: Create a new ticket
    tags:
      - Ticket
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            id_event:
              type: integer
              example: 1
            id_user:
              type: integer
              example: 123
            price:
              type: number
              example: 50.00
    responses:
      201:
        description: Ticket created successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Ticket created successfully"
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Database error"
    """
    cursor = None
    try:
        data = request.json
        id_event = data.get('id_event')
        id_user = data.get('id_user')
        price = data.get('price')

        cursor = connection.cursor()
        cursor.execute("""
                        INSERT INTO tickets (id_event, id_user, price)
                        VALUES (%s, %s, %s)
                        """, (id_event, id_user, price))
        connection.commit()

        return jsonify({'message': 'Ticket created successfully'}), 201

    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

if __name__ == '__main__':
    app.run(debug=True)