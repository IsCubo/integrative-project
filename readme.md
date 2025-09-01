# QreateFlow - Event Management System

QreateFlow is a comprehensive event management system that allows users to create, manage, and track events using QR code technology. The project combines a modern frontend built with JavaScript and a robust Python backend.

## 🚀 Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Vite (Build tool)

### Backend
- Python 3.x
- Flask (Web framework)
- MySQL (Database)
- Libraries:
  - Flask-CORS (Cross-Origin Resource Sharing)
  - bcrypt (Password hashing)
  - qrcode (QR code generation)
  - python-dotenv (Environment variables)
  - Flasgger (API documentation)
  - mysql-connector-python (Database connection)
  - smtplib (Email handling)

## 📁 Project Structure

```
integrative-project/
├── app/
│   ├── assets/
│   │   ├── icons/
│   │   │   ├── QreateFlow-horizontal.png
│   │   │   ├── QreateFlow-logo-transparent.png
│   │   │   ├── QreateFlow-logo.png
│   │   │   └── QreateFlow-story.png
│   │   └── images/
│   │       ├── photo-1569908420024-c8f709b75700.jpg
│   │       ├── photo-1672435145383-a9f1bbcf808a.jpg
│   │       └── photo-1722872112503-922d881bdddc.jpg
│   ├── css/
│   │   ├── auth.css
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── dashboard.css
│   │   └── landing.css
│   ├── js/
│   │   ├── api/
│   │   │   └── events.js
│   │   ├── main.js
│   │   ├── register.js
│   │   ├── register_event.js
│   │   ├── state/
│   │   │   └── store.js
│   │   ├── ui/
│   │   │   ├── cart.js
│   │   │   ├── myEvents.js
│   │   │   ├── renderEvents.js
│   │   │   └── tabs.js
│   │   └── utils/
│   │       └── format.js
│   └── pages/
│       ├── auth.html
│       ├── dashboard.html
│       ├── landing.html
├── DB/
│   ├── DB QreateFlow.sql
│   └── Modelo Relacional.pdf
├── qr_codes/              # Folder for generated QR images (may be empty at first)
├── server/
│   ├── __pycache__/
│   │   ├── database.cpython-310.pyc
│   │   └── index.cpython-310.pyc
│   ├── database.py
│   ├── email_utils.py
│   └── index.py
├── static/
│   └── scanner.html       # QR check-in scanner web page
├── index.html
├── package.json
├── requirements.txt
├── readme.md
├── .gitignore
```

## 🔧 Prerequisites

1. Python 3.x
2. Node.js and npm
3. MySQL Server
4. Git

## ⚙️ Installation

1. Clone the repository:
```bash
git clone https://github.com/IsCubo/integrative-project.git
cd integrative-project
```

2. Create and activate a virtual environment:

On Windows:
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\activate
```

On macOS/Linux:
```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Install Node.js dependencies:
```bash
npm install
```

5. Set up the database:
- Create a MySQL database
- Import the schema from `DB/DB EventSync.sql`

5. Configure environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# Database Configuration
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_USE_TLS=True
EMAIL_FROM=your_email@gmail.com

# Security
SECRET_KEY=your_secret_key
```

Note: For Gmail, you'll need to use an App Password instead of your regular email password. You can generate one in your Google Account settings under Security > 2-Step Verification > App passwords.

## 🚀 Running the Application

1. Start the backend server:
```bash
cd server
python index.py
```

2. Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🌟 Features

- User Registration and Authentication
- Event Creation and Management
- QR Code Generation for Events
- Event Check-in System
- Email Notifications
- Responsive Design

## 📱 API Documentation

The API documentation is available through Swagger UI when running the backend server. Access it at:
```
http://localhost:5000/apidocs
```

## 🔒 Security Features

- Password Hashing (bcrypt)
- Environment Variables Protection
- CORS Configuration
- Input Validation

## 🤝 Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Authors

- Five Tech Elements  