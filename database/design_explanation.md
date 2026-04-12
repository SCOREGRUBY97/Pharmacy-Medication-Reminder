# Database Design Explanation

This database was designed based on system requirements.

## Functional Mapping

- User registration → User table
- Medication management → Medication table
- Reminders → Reminder table
- Tracking taken/missed → Logs table
- Prescriptions → Prescription + junction table

## Relationships
- User → Reminder (1:M)
- Medication → Reminder (1:M)
- User → Prescription (1:M)
- Prescription → Medication (M:N)

## Normalisation
Database is in Third Normal Form (3NF).
