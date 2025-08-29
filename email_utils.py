# email_utils.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# SendGrid SMTP configuration
SMTP_SERVER = "smtp.sendgrid.net"
SMTP_PORT = 587
SMTP_USER = "apikey" 
SMTP_PASSWORD = "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"
FROM_EMAIL = "qreateflow@gmail.com"


def send_registration_email(to_email, user_name, event_name, qr_img):
    """
    Sends a styled HTML email with a QR code (already generated externally).
    - qr_img can be a base64 string or an image URL.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = f"🎟️ Registration Confirmed for {event_name}"

        # Detect if qr_img is base64 or URL
        if qr_img.startswith("http"):
            qr_tag = f'<img src="{qr_img}" alt="QR Code" style="margin:20px; width:200px; height:200px;" />'
        else:
            qr_tag = f'<img src="data:image/png;base64,{qr_img}" alt="QR Code" style="margin:20px; width:200px; height:200px;" />'

        # Email body (HTML + QR)
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; text-align: center; color: #333;">
            <h2 style="color:#007BFF;">Registration Confirmed ✅</h2>
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>You have successfully registered for <strong>{event_name}</strong>.</p>
            <p>Please present this QR code at the event check-in:</p>
            {qr_tag}
            <p style="margin-top:30px;">Thank you for choosing our platform 🚀</p>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())

        print(f"✅ Email with QR sent successfully to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False
