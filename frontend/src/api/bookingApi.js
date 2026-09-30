import axiosInstance from "./axiosInstance";

// ─── POST create booking (customer) ──────────────────────────────────────────
export const createBooking = (data) => axiosInstance.post("/bookings", data);

// ─── GET customer dashboard stats ────────────────────────────────────────────
// Returns: { stats: {total,pending,accepted,in_progress,completed,cancelled,rejected,totalSpent}, recentBookings }
export const fetchCustomerStats = () => axiosInstance.get("/bookings/stats");

// ─── GET provider dashboard stats ────────────────────────────────────────────
// Returns: { stats: {total,pending,...,totalEarned}, profile: {...}, recentRequests }
export const fetchProviderStats = () => axiosInstance.get("/bookings/provider-stats");

// ─── GET my bookings (customer sees own, provider sees theirs) ────────────────
// Optional: pass { params: { status: "pending" } } to filter
export const fetchMyBookings = (params = {}) =>
  axiosInstance.get("/bookings/my-bookings", { params });

// ─── GET single booking by ID ─────────────────────────────────────────────────
export const fetchBookingById = (id) => axiosInstance.get(`/bookings/${id}`);

// ─── PUT provider updates status ─────────────────────────────────────────────
// body: { status, finalPrice? }
export const updateBookingStatus = (id, data) =>
  axiosInstance.put(`/bookings/${id}/status`, data);

// ─── PUT customer cancels booking ─────────────────────────────────────────────
// body: { cancellationReason? }
export const cancelBooking = (id, cancellationReason = "") =>
  axiosInstance.put(`/bookings/${id}/cancel`, { cancellationReason });
