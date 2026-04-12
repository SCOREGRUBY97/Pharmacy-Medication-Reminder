-- User Table
CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('patient', 'admin')
);

-- Medication Table
CREATE TABLE Medication (
    medication_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    description TEXT,
    dosage_info VARCHAR(100)
);

-- Reminder Table
CREATE TABLE Reminder (
    reminder_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    medication_id INT,
    time TIME,
    frequency VARCHAR(50),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (medication_id) REFERENCES Medication(medication_id)
);

-- Prescription Table
CREATE TABLE Prescription (
    prescription_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    doctor_name VARCHAR(100),
    issue_date DATE,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

-- Junction Table
CREATE TABLE Prescription_Medication (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prescription_id INT,
    medication_id INT,
    dosage VARCHAR(100),
    FOREIGN KEY (prescription_id) REFERENCES Prescription(prescription_id),
    FOREIGN KEY (medication_id) REFERENCES Medication(medication_id)
);

-- Logs Table
CREATE TABLE Logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    reminder_id INT,
    status VARCHAR(20),
    timestamp DATETIME,
    FOREIGN KEY (reminder_id) REFERENCES Reminder(reminder_id)
);
