```markdown
# Week 7 — Backend Development

## Expected Deliverable
Develop backend services for the Pharmacy Medication Reminder system.

## Overview
The main goal of Week 7 was to build the backend part of the Pharmacy Medication Reminder web application. The backend is responsible for handling server-side logic, API requests, database connection, user data, medication records, reminder schedules, and caregiver-related information.

The backend was developed using **Node.js** and **Express.js**. Node.js was used to run the backend server, while Express.js was used to create RESTful API routes. A **PostgreSQL database** was used to store and manage system data such as users, medications, reminders, caregiver details, and medication history.

## Server Setup
The backend server was set up using Express.js. The server listens for requests from the frontend and sends responses back in JSON format. Middleware was used to allow JSON data handling and communication between the frontend and backend.

The server setup includes:
- Express.js application configuration
- JSON request handling
- API route setup
- Database connection configuration
- Error handling for failed requests

## Database Connection
The backend was connected to a PostgreSQL database. The database connection allows the application to store, retrieve, update, and delete data. This connection is important because all medication reminders, user accounts, and history records need to be saved properly.

The database connection was used for:
- Storing registered users
- Saving medication details
- Managing reminder schedules
- Recording medication status
- Supporting caregiver information

## Implemented APIs
RESTful APIs were implemented to connect the frontend with the backend database. These APIs allow the system to perform different actions such as user login, registration, medication management, and reminder scheduling.

Examples of implemented API endpoints include:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Creates a new user account |
| POST | `/login` | Allows users to log in securely |
| GET | `/medications` | Retrieves medication records |
| POST | `/medications` | Adds a new medication |
| PUT | `/medications/:id` | Updates medication details |
| DELETE | `/medications/:id` | Deletes a medication record |
| GET | `/reminders` | Retrieves reminder schedules |
| POST | `/reminders` | Creates a new medication reminder |
| PUT | `/reminders/:id` | Updates reminder status |
| GET | `/history` | Displays medication history and reports |

## Validations Implemented
Validations were added to make sure users enter correct and complete data. This helps prevent wrong data from being saved in the database.

The validations include:
- Required field validation
- Email format validation
- Password length validation
- Duplicate user account checking
- Medication name validation
- Dosage validation
- Reminder date and time validation
- Error messages for missing or incorrect input

## Evidence Screenshots

### Backend Folder Structure / Backend Code
![Backend Evidence](backend.png)

### Database Connection Evidence
![Database Connection Evidence](connection.png)

## Week 7 Deliverable Summary
By the end of Week 7, the backend services were developed and connected with the database. The server was successfully set up, RESTful API endpoints were implemented, and validations were added to support safe and correct data entry. The backend is now ready to support the frontend features of the Pharmacy Medication Reminder system.
```
