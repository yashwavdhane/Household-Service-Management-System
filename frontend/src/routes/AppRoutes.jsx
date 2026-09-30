import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Public pages ──────────────────────────────────────────────────────────────
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ServicesPage from "../pages/ServicesPage";
import ProvidersPage from "../pages/ProvidersPage";
import ProviderDetailPage from "../pages/ProviderDetailPage";

// ── Dashboard pages ───────────────────────────────────────────────────────────
import CustomerDashboard from "../pages/dashboard/CustomerDashboard";
import ProviderDashboard from "../pages/dashboard/ProviderDashboard";
import AdminDashboard from "../pages/dashboard/AdminDashboard";

// ── Provider sub-pages ────────────────────────────────────────────────────────
import ProviderProfilePage from "../pages/dashboard/ProviderProfilePage";
import ProviderBookingsPage from "../pages/dashboard/ProviderBookingsPage";

// ── Admin sub-pages ───────────────────────────────────────────────────────────
import AdminCategoriesPage from "../pages/dashboard/AdminCategoriesPage";

// ── Booking pages ─────────────────────────────────────────────────────────────
import BookingPage from "../pages/BookingPage";
import BookingDetailPage from "../pages/BookingDetailPage";
import MyBookingsPage from "../pages/dashboard/MyBookingsPage";

// ── Guards ────────────────────────────────────────────────────────────────────
import ProtectedRoute from "../components/common/ProtectedRoute";
import RoleRoute from "../components/common/RoleRoute";

// ─── Helper: redirect to correct dashboard ────────────────────────────────────
const roleDash = (role) =>
  role === "admin" ? "/dashboard/admin" : role === "provider" ? "/dashboard/provider" : "/dashboard/customer";

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      {/* ── Public ──────────────────────────────────────────────────────── */}
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/providers" element={<ProvidersPage />} />
      <Route path="/providers/:id" element={<ProviderDetailPage />} />

      {/* Auth — redirect if already logged in */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={roleDash(user?.role)} replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to={roleDash(user?.role)} replace /> : <Register />}
      />

      {/* ── Protected: Customer ─────────────────────────────────────────── */}
      <Route
        path="/dashboard/customer"
        element={
          <ProtectedRoute>
            <RoleRoute roles={["customer", "admin"]}>
              <CustomerDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <RoleRoute roles={["customer"]}>
              <MyBookingsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/book/:providerId"
        element={
          <ProtectedRoute>
            <RoleRoute roles={["customer"]}>
              <BookingPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ── Protected: Provider ─────────────────────────────────────────── */}
      <Route
        path="/dashboard/provider"
        element={
          <ProtectedRoute>
            <RoleRoute roles={["provider", "admin"]}>
              <ProviderDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/profile"
        element={
          <ProtectedRoute>
            <RoleRoute roles={["provider"]}>
              <ProviderProfilePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/bookings"
        element={
          <ProtectedRoute>
            <RoleRoute roles={["provider"]}>
              <ProviderBookingsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ── Protected: Admin ─────────────────────────────────────────────── */}
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute>
            <RoleRoute roles={["admin"]}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute>
            <RoleRoute roles={["admin"]}>
              <AdminCategoriesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ── Protected: Booking Detail (customer + provider + admin) ───── */}
      <Route
        path="/bookings/:id"
        element={
          <ProtectedRoute>
            <RoleRoute roles={["customer", "provider", "admin"]}>
              <BookingDetailPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ── 404 ─────────────────────────────────────────────────────────── */}
      <Route
        path="*"
        element={
          <div
            style={{
              minHeight: "100vh", backgroundColor: "var(--color-bg)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              textAlign: "center", padding: "24px",
            }}
          >
            <div style={{ fontSize: "72px", marginBottom: "16px" }}>🔍</div>
            <h1
              style={{
                fontSize: "72px", fontWeight: 800,
                backgroundImage: "linear-gradient(135deg, var(--color-primary-light), var(--color-secondary))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                marginBottom: "8px",
              }}
            >
              404
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "16px", marginBottom: "28px" }}>
              This page doesn&apos;t exist
            </p>
            <a
              href="/"
              style={{
                padding: "12px 28px", borderRadius: "10px",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "15px",
              }}
            >
              Go Home
            </a>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
