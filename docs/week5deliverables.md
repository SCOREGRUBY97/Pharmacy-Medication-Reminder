# Week 5 — Database & API Design (Expanded)

## 1. Overview

In Week 5, the focus of the project was to design the database structure and API layer for the Pharmacy Medication Reminder System. This stage is very important because it builds the foundation of how data is stored, managed, and communicated between the frontend and backend.

Based on the SRS, the system needs to handle multiple types of data such as users, medications, reminders, adherence tracking, caregiver information, prescriptions, and notifications. Therefore, a relational database (PostgreSQL) was selected to ensure structured data storage, consistency, and scalability.

At the same time, RESTful APIs were designed to allow smooth communication between the frontend (React) and backend (Node.js). These APIs handle operations such as user authentication, medication management, reminder scheduling, and report generation.

---

## 2. Database Design Explanation

The database design follows a relational model where all entities are connected through primary keys and foreign keys. This ensures data integrity and avoids duplication.

### Key Design Decisions

- Each user can have multiple medications  
- Each medication can have multiple reminders  
- Each reminder can generate adherence records and notifications  
- Caregivers are linked to users for monitoring support  
- Prescriptions are stored separately for reference  

This structure ensures that the system is flexible, scalable, and supports future features like analytics or AI-based recommendations.

---

## 3. ERD Explanation

The ERD shows how different parts of the system are connected. A **User** is the central entity and connects to most of the other tables. Each user can store multiple medications, and each medication can have multiple reminders.

These reminders generate adherence records which track whether medicine was taken or missed.

The diagram also includes caregiver relationships, allowing another user to monitor medication adherence. Notifications are generated from reminders, which ensures that alerts are sent correctly.

### Benefits of this Design

- Data consistency  
- Scalability  
- Easy querying and reporting  

---

## 4. API Design Explanation

The API layer is designed using REST principles. Each endpoint performs a specific action such as creating, retrieving, updating, or deleting data.

### Key Features of API Design

- Follows REST structure (GET, POST, PUT, DELETE)  
- Uses JSON format for communication  
- Supports authentication using JWT  
- Ensures validation and error handling  

---

## 5. Conclusion

In Week 5, the database and API design for the Pharmacy Medication Reminder System were successfully developed. The relational database structure ensures efficient data storage and strong relationships between system components.

The API design allows smooth communication between frontend and backend while supporting all major system functionalities such as authentication, medication tracking, reminders, and caregiver monitoring.

This week plays a critical role in the project because it acts as the foundation for backend development in Week 7 and ensures that the system can scale and perform efficiently in real-world usage.
