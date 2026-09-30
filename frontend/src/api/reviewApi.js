import axiosInstance from "./axiosInstance";

// ─── POST submit a review (customer only) ─────────────────────────────────────
// body: { bookingId, rating, comment }
export const submitReview = (data) => axiosInstance.post("/reviews", data);

// ─── GET all reviews for a provider (public) ─────────────────────────────────
// params: { page, limit }
export const fetchProviderReviews = (providerId, params = {}) =>
  axiosInstance.get(`/reviews/provider/${providerId}`, { params });

// ─── GET existing review for a booking (customer/admin) ───────────────────────
export const fetchBookingReview = (bookingId) =>
  axiosInstance.get(`/reviews/booking/${bookingId}`);

// ─── DELETE a review (admin only) ────────────────────────────────────────────
export const deleteReview = (reviewId) =>
  axiosInstance.delete(`/reviews/${reviewId}`);
