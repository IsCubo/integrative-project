# email_utils.py
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT")) if os.getenv("SMTP_PORT") else 587 # Puerto estándar para TLS
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_registration_email(to_email, user_name, event_name, qr_code_data, qr_image_path=None):
    """
    Sends a registration confirmation email with QR code details.
    
    :param to_email: Email del destinatario.
    :param user_name: Nombre del usuario.
    :param event_name: Nombre del evento.
    :param qr_code_data: El string del código QR (ej. "123-456-uuid").
    :param qr_image_path: Ruta al archivo de imagen del QR (opcional).
    """
    try:
        if not all([SMTP_SERVER, SMTP_USER, SMTP_PASSWORD]):
            print("❌ Error de configuración SMTP: Faltan variables de entorno (SMTP_SERVER, SMTP_USER, SMTP_PASSWORD)")
            return False

        subject = f"Confirmación de Registro para {event_name}"
        body_text = f"""
        Hola {user_name},

        ✅ Tu registro para "{event_name}" ha sido confirmado.

        Tu código QR de acceso es: {qr_code_data}

        Por favor, presenta este QR en la entrada para confirmar tu asistencia.

        Saludos cordiales,
        El Equipo de Gestión de Eventos
        """

        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body_text, "plain"))

        # Si hay una imagen QR, la adjuntamos
        if qr_image_path and os.path.exists(qr_image_path):
            try:
                with open(qr_image_path, "rb") as f:
                    img_data = f.read()
                from email.mime.image import MIMEImage
                image = MIMEImage(img_data, name=os.path.basename(qr_image_path))
                msg.attach(image)
            except Exception as e:
                print(f"⚠️ Error al adjuntar imagen QR: {e}")

        # Conectar al servidor SMTP
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls() # Habilitar cifrado TLS
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_email, msg.as_string())
        server.quit()

        print(f"✅ Correo enviado a {to_email} para el evento {event_name}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar correo: {e}")
        return False