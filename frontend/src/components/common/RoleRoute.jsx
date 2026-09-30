import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * RoleRoute — Allows access only to specific roles.
 * Must be used inside a ProtectedRoute (assumes user is already authenticated).
 *
 * Usage:
 *   <RoleRoute roles={["admin"]}>
 *     <AdminDashboard />
 *   </RoleRoute>
 */
const RoleRoute = ({ children, roles = [] }) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    // Redirect to their own dashboard instead of showing an error page
    const dashboardMap = {
      customer: "/dashboard/customer",
      provider: "/dashboard/provider",
      admin: "/dashboard/admin",
    };
    const fallback = dashboardMap[user?.role] || "/";
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default RoleRoute;
