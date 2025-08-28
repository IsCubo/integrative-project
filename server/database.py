import mysql.connector
from mysql.connector import Error

def create_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='admin123',
            database='events'
        )

        if connection.is_connected():
            print("connection successful")
            return connection

    except Error as e:
        print(f"❌ Error connecting to MySQL: {e}")
        return None
