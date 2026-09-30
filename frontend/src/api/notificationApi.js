import axiosInstance from "./axiosInstance";

// ─── GET logged-in user's notifications (paginated) ───────────────────────────
// Params: { page, limit }
export const fetchNotifications = (params = {}) =>
  axiosInstance.get("/notifications", { params });

// ─── PUT mark a single notification as read ───────────────────────────────────
export const markNotificationRead = (id) =>
  axiosInstance.put(`/notifications/${id}/read`);

// ─── PUT mark all user's notifications as read ────────────────────────────────
export const markAllNotificationsRead = () =>
  axiosInstance.put("/notifications/read-all");
