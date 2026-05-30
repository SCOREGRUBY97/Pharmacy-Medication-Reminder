# 💊 MediCare — Pharmacy Medication Reminder System
### Full-Stack Monorepo | React + Node.js + PostgreSQL + OpenAI

---

## 📁 Project Structure

```
medicare-system/                    ← ROOT (monorepo)
├── package.json                    ← Root scripts: npm run dev (starts BOTH)
├── .env.example                    ← All environment variables
├── .gitignore
│
├── frontend/                       ← React Web Application
│   ├── package.json                ← React dependencies + "proxy": "localhost:5000"
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js                ← React entry point
│       ├── App.jsx                 ← Router + Protected routes
│       ├── context/
│       │   └── AuthContext.jsx     ← Global auth state (login/register/logout)
│       ├── services/
│       │   └── api.js              ← ★ ALL API calls (axios) — connects to backend
│       ├── hooks/
│       │   └── useApi.js           ← Custom hooks (useMedications, useReminders…)
│       ├── components/
│       │   └── shared/
│       │       └── Layout.jsx      ← Sidebar navigation (includes AI Assistant link)
│       └── pages/
│           ├── LoginPage.jsx       ← Register + Login (calls /api/auth/*)
│           ├── DashboardPage.jsx   ← Calls /api/dashboard
│           ├── MedicationsPage.jsx ← Calls /api/medicines (full CRUD)
│           ├── RemindersPage.jsx   ← Calls /api/reminders/*
│           ├── HistoryPage.jsx     ← Calls /api/reminders/adherence-summary
│           ├── CaregiverPage.jsx   ← Calls /api/caregiver/*
│           ├── AIAssistantPage.jsx ← ★ AI chat UI (calls /api/ai/advice)
│           └── ProfilePage.jsx     ← User profile + logout
│
├── backend/                        ← Node.js + Express API Server
│   ├── package.json                ← Express dependencies
│   ├── .env.example
│   └── src/
│       ├── server.js               ← ★ Express app entry point
│       ├── db.js                   ← PostgreSQL connection pool
│       ├── schema.sql              ← All 7 database tables
│       ├── middleware/
│       │   ├── auth.js             ← JWT verify + role-based access
│       │   └── errorHandler.js     ← Global error handling
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── medicationController.js
│       │   ├── reminderController.js
│       │   ├── caregiverController.js
│       │   └── aiController.js     ← ★ OpenAI API integration (AI API requirement)
│       ├── routes/
│       │   ├── authRoutes.js       ← /api/auth/*
│       │   ├── medicationRoutes.js ← /api/medicines/*
│       │   ├── reminderRoutes.js   ← /api/reminders/*
│       │   ├── caregiverRoutes.js  ← /api/caregiver/*, /api/dashboard
│       │   ├── adminRoutes.js      ← /api/admin/*
│       │   └── aiRoutes.js         ← ★ /api/ai/advice (AI API requirement)
│       └── utils/
│           ├── emailService.js     ← Nodemailer email notifications
│           └── scheduler.js        ← Node-cron auto-reminder jobs
│
├── docs/                           ← Project documentation
│   └── architecture_diagram.png
└── tests/
    └── auth.test.js                ← Jest + Supertest tests
```

---

## 🔗 How Frontend Connects to Backend

```
React (port 3000)          Node.js API (port 5000)
     │                              │
     │  POST /api/auth/login  ──────►  authController.login()
     │  GET  /api/dashboard   ──────►  caregiverController.getDashboard()
     │  POST /api/medicines   ──────►  medicationController.addMedication()
     │  PATCH /api/reminders/:id/status ► reminderController.updateReminderStatus()
     │                              │
     ◄──── JWT token in response ───┘
     │
     └── Stored in localStorage
         Sent as: Authorization: Bearer <token>
         on every subsequent request
```

**Key connection file:** `frontend/src/services/api.js`
- Uses `axios` with base URL `http://localhost:5000/api`
- Auto-attaches JWT token to every request
- Auto-redirects to `/login` on 401

**Proxy (development):** `frontend/package.json` has `"proxy": "http://localhost:5000"` so React dev server forwards `/api/*` calls to Express automatically.

---

## ⚙️ Setup & Run (3 steps)

### Step 1: Install everything
```bash
git clone <repo-url> medicare-system
cd medicare-system
npm run setup
```

### Step 2: Configure environment
```bash
cp .env.example .env
# Edit .env — add your PostgreSQL password and Gmail app password
```

### Step 3: Setup database
```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE pharmacy_reminder;"

# Run schema (creates all 7 tables)
npm run setup:db
```

### Step 4: Start both servers together
```bash
npm run dev
```

This starts:
- ✅ **Frontend**: http://localhost:3000 (React)
- ✅ **Backend**:  http://localhost:5000 (Express API)

---

## 🔐 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → get JWT |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/dashboard` | Full dashboard data |
| GET  | `/api/medicines` | List medications |
| POST | `/api/medicines` | Add medication |
| PUT  | `/api/medicines/:id` | Edit medication |
| DELETE | `/api/medicines/:id` | Delete medication |
| GET  | `/api/reminders/today` | Today's reminders |
| PATCH | `/api/reminders/:id/status` | Mark taken/missed |
| GET  | `/api/reminders/adherence-summary` | Adherence stats |
| POST | `/api/caregiver/link` | Link caregiver |
| GET  | `/api/caregiver/my-caregivers` | View my caregivers |
| GET  | `/api/caregiver/patients` | View patients (caregiver role) |
| GET  | `/api/admin/stats` | Admin system statistics |
| GET  | `/api/admin/users` | List all users (admin) |
| POST | `/api/ai/advice` | ★ AI medication assistant (OpenAI) |

---

## 🚀 Deployment

| Layer | Platform | Cost |
|-------|----------|------|
| Frontend | Vercel | Free |
| Backend | Railway or Render | Free tier |
| Database | Supabase PostgreSQL | Free tier |

```bash
# Frontend → Vercel
cd frontend && npx vercel

# Backend → Railway
cd backend && railway up
```

Set `REACT_APP_API_URL=https://your-backend.railway.app/api` in Vercel env vars.

---

## 🤖 AI API Implementation (Assessment Requirement)

This project includes a secure **OpenAI-powered AI Assistant** to satisfy the AI API implementation requirement.

### Files involved:
| File | Purpose |
|------|---------|
| `backend/src/controllers/aiController.js` | Core OpenAI API call logic |
| `backend/src/routes/aiRoutes.js` | Protected route: `POST /api/ai/advice` |
| `frontend/src/pages/AIAssistantPage.jsx` | Chat UI page for users |
| `frontend/src/services/api.js` | `aiAPI.ask()` axios call |

### How it works:
1. User types a question on the AI Assistant page
2. Frontend sends `POST /api/ai/advice` with JWT token
3. Backend fetches the user's real medication list from PostgreSQL
4. Sends medication context + question to OpenAI (`gpt-4.1-mini`)
5. AI returns simple reminder/adherence guidance
6. Response displayed in the frontend with a safety disclaimer

### Safety design:
- System prompt prevents diagnosis, prescribing, or dosage changes
- Users always advised to contact doctor or pharmacist
- If no `OPENAI_API_KEY` is set, returns a **safe demo response** — feature still works for demonstration

### To enable live AI:
```bash
# Add to your .env file:
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

---

## 🧪 Testing

```bash
cd backend && npm test
```

Covers: TC01 Register, TC02 Invalid login, TC03 Add medication, TC07 Unauthorized access (SRS Section 12)
