import axiosInstance from "./axiosInstance";

// ─── GET providers (with optional filters) ────────────────────────────────────
// Params: { category, serviceArea, rating, available }
export const fetchProviders = (params = {}) =>
  axiosInstance.get("/providers", { params });

// ─── GET single provider by profile ID ───────────────────────────────────────
export const fetchProviderById = (id) => axiosInstance.get(`/providers/${id}`);

// ─── GET current provider's own profile ──────────────────────────────────────
export const fetchMyProviderProfile = () => axiosInstance.get("/providers/me");

// ─── PUT update provider profile ─────────────────────────────────────────────
export const updateProviderProfile = (data) =>
  axiosInstance.put("/providers/profile", data);

// ─── PUT toggle availability ──────────────────────────────────────────────────
export const updateAvailability = (availability) =>
  axiosInstance.put("/providers/availability", { availability });
