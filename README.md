# 🏠 Household Service Management System

A full-stack MERN application connecting customers with verified household service providers. Built as a college major project.

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React.js (Vite), Tailwind CSS v4  |
| Backend   | Node.js, Express.js               |
| Database  | MongoDB + Mongoose                |
| Auth      | JWT + bcryptjs                    |
| HTTP      | Axios                             |
| Routing   | React Router DOM v7               |

## Project Structure

```
household-service-management/
├── frontend/          ← React + Vite + Tailwind
│   ├── src/
│   │   ├── api/       ← Axios instance & API calls
│   │   ├── components/← Reusable UI components
│   │   ├── context/   ← React Context (Auth, etc.)
│   │   ├── hooks/     ← Custom React hooks
│   │   ├── pages/     ← Page components
│   │   ├── routes/    ← Route definitions
│   │   └── utils/     ← Helper functions
│   ├── .env
│   └── vite.config.js
│
└── backend/           ← Express REST API
    ├── config/        ← MongoDB connection
    ├── controllers/   ← Route handler logic
    ├── middleware/     ← Auth, error handlers
    ├── models/        ← Mongoose schemas
    ├── routes/        ← Express routers
    ├── utils/         ← Shared utilities
    ├── .env
    └── server.js
```

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env and set your MONGO_URI
npm install
npm run dev
```
Backend runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

## User Roles
| Role             | Capabilities                                        |
|------------------|-----------------------------------------------------|
| **Customer**     | Browse providers, book services, write reviews      |
| **Provider**     | Manage bookings, update profile, track earnings     |
| **Admin**        | Manage users, categories, view reports              |

## API Endpoints

| Method | Endpoint       | Description              |
|--------|----------------|--------------------------|
| GET    | /api/health    | Server health check      |
| POST   | /api/auth/...  | Auth routes (Phase 2)    |
| GET    | /api/users/... | User routes (Phase 3)    |

## Development Phases

- [x] **Phase 1** — Project setup & architecture
- [ ] **Phase 2** — Authentication & authorization
- [ ] **Phase 3** — User profile management
- [ ] **Phase 4** — Service categories
- [ ] **Phase 5** — Provider profiles & search
- [ ] **Phase 6** — Booking & scheduling
- [ ] **Phase 7** — Dashboards
- [ ] **Phase 8** — Ratings & reviews
- [ ] **Phase 9** — Notifications

---
> 📚 College Major Project | MERN Stack | 2026
