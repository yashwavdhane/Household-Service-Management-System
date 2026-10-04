import axiosInstance from "./axiosInstance";

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export const fetchAdminDashboard = () => axiosInstance.get("/admin/dashboard");

// ─── Analytics ────────────────────────────────────────────────────────────────
export const fetchAdminAnalytics = () => axiosInstance.get("/admin/analytics");

// ─── Communications ───────────────────────────────────────────────────────────
export const fetchAdminCommunications = (params = {}) => 
  axiosInstance.get("/admin/communications", { params });

// ─── Users ────────────────────────────────────────────────────────────────────
// params: { search, role, isActive, page, limit }
export const fetchAdminUsers = (params = {}) =>
  axiosInstance.get("/admin/users", { params });

export const updateUserStatus = (id, isActive) =>
  axiosInstance.put(`/admin/users/${id}/status`, { isActive });

export const deleteUser = (id) =>
  axiosInstance.delete(`/admin/users/${id}`);

// ─── Providers ────────────────────────────────────────────────────────────────
// params: { search, isVerified, availability, page, limit }
export const fetchAdminProviders = (params = {}) =>
  axiosInstance.get("/admin/providers", { params });

export const updateProviderVerification = (id, isVerified) =>
  axiosInstance.put(`/admin/providers/${id}/verify`, { isVerified });

// ─── Bookings ─────────────────────────────────────────────────────────────────
// params: { status, categoryId, page, limit }
export const fetchAdminBookings = (params = {}) =>
  axiosInstance.get("/admin/bookings", { params });
