# 🎟️ QR Event Check-in System

This is a web-based platform for **event management and QR code check-in validation**, developed as part of the Riwi Integrator Project 2025.  
It allows organizers to register participants, send confirmation emails with QR codes, and validate check-ins in real time.

---

## 🚀 Features
- User registration for events.
- Automatic **QR code generation** per participant.
- Confirmation email with **styled HTML and embedded QR code** (via SendGrid SMTP).
- QR validation at event check-in.
- Dashboard for event organizers (attendees, check-in status).
- MySQL database integration with Flask + SQLAlchemy.

---

## 🛠️ Tech Stack
- **Backend:** Python (Flask, SQLAlchemy)
- **Frontend:** HTML, CSS, JavaScript
- **Database:** MySQL
- **Email Service:** SendGrid SMTP
- **QR Handling:** Python `qrcode`, base64 encoding

---

## 📂 Project Structure
project/
│── app.py # Flask application (routes)
│── models.py # Database models (SQLAlchemy)
│── email_utils.py # Email sending with HTML + QR code
│── static/ # Static files (QR scanner, JS, CSS)
│── templates/ # HTML templates (if needed)
│── .env # Environment variables (DB_URI, API keys)
│── requirements.txt # Project dependencies



---

## ⚙️ Setup & Installation
1. Clone the repository:
   
   git clone https://github.com/your-repo/qr-event-checkin.git
   cd qr-event-checkin

Create a virtual environment:

    python -m venv venv
    source venv/bin/activate   # Mac/Linux
    venv\Scripts\activate      # Windows

Install dependencies:

    pip install -r requirements.txt

Configure .env file:

ini

    DB_URI=mysql+mysqlconnector://user:password@localhost/eventdb
    SENDGRID_API_KEY=your_api_key

Run the app:

    python app.py


📧 Email Example
When a user registers, they receive an HTML email:

Personalized message with their name and event.

QR code embedded directly in the email.

Instructions for check-in.

📌 Roadmap
 User registration with DB persistence

 QR code generation

 Confirmation email with QR (HTML)

 Organizer dashboard

 Reports & analytics

 Deployment (Netlify + Render)

👥 Team
Developed by Clan Integrator Team under Scrum methodology:

Scrum Master: [Your Name]

Developers: [Team Members]

📜 License
This project is for educational purposes under the Riwi Integrator Project 2025.





