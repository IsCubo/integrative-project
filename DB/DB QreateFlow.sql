-- Create the QreateFlow database
CREATE DATABASE QreateFlow;
USE QreateFlow;

-- Table for user roles (admin, attendee...)
CREATE TABLE roles(
id INTEGER AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100) NOT NULL
);

-- Table for event locations
CREATE TABLE location(
id INTEGER AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL,
address VARCHAR(255) UNIQUE NOT NULL
);

-- Table for event categories
CREATE TABLE category(
id INTEGER AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(225) NOT NULL
);  

-- Table for events
CREATE TABLE events(
id INTEGER AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(225) NOT NULL,
date_time DATETIME NOT NULL, -- Event date and time
capacity INTEGER NOT NULL,   -- Maximum number of attendees
description TEXT,
id_category INTEGER,         -- Foreign key to category
created_at DATE NOT NULL DEFAULT (CURRENT_DATE), -- Creation date
update_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Last update timestamp
id_location INTEGER,         -- Foreign key to location
FOREIGN KEY (id_category) REFERENCES category(id),
FOREIGN KEY (id_location) REFERENCES location(id)
ON UPDATE CASCADE
ON DELETE CASCADE
);

-- Table for users
CREATE TABLE users(
id INTEGER AUTO_INCREMENT PRIMARY KEY,
full_name VARCHAR(255) NOT NULL,
is_active BOOLEAN NOT NULL DEFAULT TRUE, -- User status
id_role INTEGER,                        -- Foreign key to roles
email VARCHAR(255) UNIQUE NOT NULL,
password VARCHAR(225) NOT NULL,
created_at DATE NOT NULL DEFAULT (CURRENT_DATE),
update_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (id_role) REFERENCES roles(id)
ON UPDATE CASCADE
);

-- Table for tickets
CREATE TABLE tickets(
id INTEGER AUTO_INCREMENT PRIMARY KEY,
id_event INTEGER,         -- Foreign key to events
id_user INTEGER NULL,     -- Foreign key to users
price DECIMAL(10,2),      -- Ticket price
created_at DATE NOT NULL DEFAULT (CURRENT_DATE),
update_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
QR TEXT,                  -- QR code for the ticket
FOREIGN KEY (id_event) REFERENCES events(id),
FOREIGN KEY (id_user) REFERENCES users(id) 
ON UPDATE CASCADE
ON DELETE SET NULL
);

-- Table for event registrations
CREATE TABLE event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INTEGER NOT NULL,      -- Foreign key to users
    event_id INTEGER NOT NULL,     -- Foreign key to events
    qr_code VARCHAR(200) UNIQUE NOT NULL, -- Unique QR code for registration
    checked_in BOOLEAN DEFAULT FALSE,     -- Check-in status
    registration_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- Registration timestamp
    checkin_time DATETIME NULL,           -- Check-in timestamp
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);
