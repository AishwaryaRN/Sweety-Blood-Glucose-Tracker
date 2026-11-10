# 💗 Sweety – Blood Glucose Tracker

A full-stack web application that allows users to record, manage, and monitor their blood glucose readings.

## Features

- User registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- Add, view, edit, and delete glucose readings
- Record readings by date and time slot
- Glucose value validation (40–600 mg/dL)
- Daily glucose reports
- Month-to-date reports
- Previous-month reports
- Highest, lowest, average, and total reading statistics
- User-specific reading history

## Technology Stack

**Frontend**
- React.js
- Vite
- CSS

**Backend**
- Node.js
- Express.js
- bcryptjs
- JSON Web Token (JWT)

**Database**
- PostgreSQL

## Project Structure

```text
Sweety/
├── backend/
│   ├── .env.example
│   ├── auth.js
│   ├── db.js
│   ├── readings.js
│   ├── reports.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── index.html
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/AishwaryaRN/Sweety-Blood-Glucose-Tracker.git
cd Sweety-Blood-Glucose-Tracker
```

### 2. Set up PostgreSQL

- Install PostgreSQL.
- Create a database named `sweety_db`.
- Create the required `users` and `glucose_readings` tables.

### 3. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` as a template.

Add your PostgreSQL password and a secure JWT secret.

### 4. Start the backend

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

### 5. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a user |
| POST | `/api/auth/login` | User login |
| GET | `/api/readings` | View readings |
| POST | `/api/readings` | Add a reading |
| PUT | `/api/readings/:id` | Update a reading |
| DELETE | `/api/readings/:id` | Delete a reading |
| GET | `/api/reports` | Generate reports |

Protected routes require JWT authentication.

## Security

- Passwords are hashed using bcryptjs.
- JWT is used for authentication.
- Users can access only their own glucose readings.
- Environment secrets are excluded from Git.

## Author

**Aiswarya R. Nair**

GitHub: [AishwaryaRN](https://github.com/AishwaryaRN)

## Future Improvements

- Glucose trend charts
- Downloadable reports
- Email notifications
- Additional health insights
## Demo Account

Use the following credentials to test the application:

- Email: demo@sweety.com
- Password: Demo@123

Run the seed script to create the demo account and sample readings:

```bash
cd backend
npm run seed