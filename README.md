# Household Service Management System (HSMS)

A full-stack MERN application for managing household services, connecting customers with verified professional service providers. Built with modern, glassmorphic UI, role-based access control, and real-time state management.

## 📁 1. Final Project Structure

```
Household Service Management System/
│
├── backend/                  # Express.js REST API
│   ├── controllers/          # Request handlers (auth, booking, admin, etc.)
│   ├── middleware/           # JWT auth & Role checking middlewares
│   ├── models/               # Mongoose schemas (User, ProviderProfile, Booking, Review, Notification, Category)
│   ├── routes/               # Express route definitions
│   ├── uploads/              # Local image storage for profile photos (gitignored)
│   ├── .env                  # Environment variables
│   ├── .env.example          # Example environment variables
│   └── server.js             # Application entry point & DB connection
│
└── frontend/                 # React.js SPA (Vite)
    ├── src/
    │   ├── api/              # Axios API clients & interceptors
    │   ├── components/       # Reusable UI components (DashboardShell, ProfileImageUpload, etc.)
    │   ├── context/          # React Context (AuthContext)
    │   ├── pages/            # Page-level components
    │   ├── routes/           # AppRoutes and Role-based Protected Routes
    │   ├── App.jsx           # Main App component
    │   ├── index.css         # Global styles & responsive utilities
    │   └── main.jsx          # React DOM render entry
    ├── vite.config.js        # Vite configuration (proxies /api and /uploads)
    └── package.json          # Dependencies & scripts
```

## 📦 2. Complete Dependency List

### Backend (`backend/package.json`)
- `express`: ^4.21.2
- `mongoose`: ^8.10.1 (MongoDB ODM)
- `bcryptjs`: ^3.0.2 (Password hashing)
- `jsonwebtoken`: ^9.0.2 (Auth tokens)
- `cors`: ^2.8.5 (Cross-Origin Resource Sharing)
- `dotenv`: ^16.4.7 (Environment variables)
- `multer`: ^1.4.5-lts.1 (File uploads)

### Frontend (`frontend/package.json`)
- `react` & `react-dom`: ^19.0.0
- `react-router-dom`: ^7.2.0 (Client-side routing)
- `axios`: ^1.7.9 (HTTP client)
- `lucide-react`: ^0.475.0 (Icons)

## ⚙️ 3. Backend `.env.example`

Create a `.env` file in the `backend/` directory:

```env
# Application Port
PORT=5000

# MongoDB Connection String (Local or Atlas)
MONGO_URI=mongodb://127.0.0.1:27017/hsms_db

# JWT Secret Key (Use a strong random string)
JWT_SECRET=super_secret_jwt_key_12345
JWT_EXPIRE=30d
```

## ⚙️ 4. Frontend `.env.example`

Create a `.env` file in the `frontend/` directory (Optional, default is handled via Vite proxy):

```env
# Vite API Base URL (Not strictly needed if using the Vite proxy in vite.config.js)
VITE_API_URL=http://localhost:5000/api
```

## 🗄️ 5. MongoDB Setup Instructions

1. **Install MongoDB**: Ensure MongoDB Community Server is installed and running locally, or create a free cluster on MongoDB Atlas.
2. **Database Connection**: 
   - Local: Use `mongodb://127.0.0.1:27017/hsms_db` in your backend `.env`.
   - Atlas: Replace the connection string with your Atlas URI (e.g., `mongodb+srv://<user>:<password>@cluster.mongodb.net/hsms`).
3. **Mongoose auto-creates**: The database and collections will be automatically created upon the first document insertion.

## 🚀 6. Commands to Run Frontend and Backend

Open two separate terminals in the root of the project.

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
# The server will start on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
# The React app will start on http://localhost:5173
```

## 🌱 7. Seed Data Instructions

To set up the initial platform state:
1. Register a new user and select the **Customer** role.
2. Register a new user and select the **Provider** role.
3. **To get an Admin account**: Since admins cannot be registered via the UI (for security), open MongoDB Compass (or Mongo Shell) and manually change a registered user's `role` field from `"customer"` to `"admin"`.
4. Log in as the Admin and navigate to the **Admin Dashboard**. From there, you can create **Service Categories** (e.g., Plumbing, Cleaning).
5. Providers can then edit their profiles and select those categories!

## ✅ 8. Final Testing Checklist

- [x] **Authentication**: Registration, login, JWT issuance, and secure logout.
- [x] **Role-based Auth**: Customers can't access provider routes, and only Admins can access the admin dashboard.
- [x] **Booking Workflow**: Customer creates a booking → Provider accepts → Job is started → Completed.
- [x] **Review System**: Only customers can review completed jobs. Ratings automatically average out on the provider's profile.
- [x] **Notifications**: Action-triggered notifications (e.g., Provider accepted your booking) with unread badging.
- [x] **Image Uploads**: `multer` seamlessly stores files locally and Vite serves them via proxy.
- [x] **Responsive UI**: All grids auto-fit, and a mobile hamburger menu ensures navigation works perfectly on small screens.

## 🌐 9. Deployment Recommendations

- **Frontend (Vite/React)**: Deploy on **Vercel** or **Netlify**. Ensure you configure rewrite rules for React Router so that all paths fallback to `index.html`.
- **Backend (Express)**: Deploy on **Render**, **Railway**, or **Heroku**. 
- **Database**: Use **MongoDB Atlas** for a production-ready, cloud-hosted database.
- **Image Storage Note**: Since images are currently stored locally in `backend/uploads/`, deploying to an ephemeral filesystem (like Render/Heroku) means images will be lost on restart. For production, consider integrating **Cloudinary** or **AWS S3** instead of local `multer` storage.

## 🎓 10. Important Project Features for Viva/Demonstration

1. **Robust Role-Based Architecture (RBAC)**: Highlight how the system distinctly separates Customer, Provider, and Admin views, restricting API access at the middleware level.
2. **Complex State Management**: Showcase the booking lifecycle. It transitions from `pending` -> `accepted` -> `in_progress` -> `completed` (or `cancelled`), with specific rules at each state (e.g. reviews only allowed on `completed` jobs).
3. **Real-time UX with Polling/Hooks**: Demonstrate how notifications trigger when a booking state changes, updating the notification bell in the Navbar.
4. **Data Aggregation**: Show the Admin Dashboard or Provider average ratings. These utilize dynamic aggregations or pre-calculated field updates to keep performance high.
5. **Modern, Responsive Design**: Emphasize the "Mobile-First" approach, the implementation of CSS custom variables for theming, and the premium glassmorphic UI components.
6. **Secure Image Uploads**: Explain how `multer` validates file extensions and caps file sizes before storing them on the disk to prevent server bloat.
