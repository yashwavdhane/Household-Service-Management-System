import axiosInstance from "./axiosInstance";

// ─── GET provider services (public, filtered) ─────────────────────────────────
// Params: { providerId, categoryId, activeOnly }
export const fetchProviderServices = (params = {}) =>
  axiosInstance.get("/provider-services", { params });

// ─── GET current provider's own services ─────────────────────────────────────
export const fetchMyServices = () =>
  axiosInstance.get("/provider-services/my-services");

// ─── GET a single provider service ───────────────────────────────────────────
export const fetchProviderServiceById = (id) =>
  axiosInstance.get(`/provider-services/${id}`);

// ─── POST create a new service offering (provider) ────────────────────────────
// body: { serviceCategoryId, serviceName, description, price, pricingType }
export const createProviderService = (data) =>
  axiosInstance.post("/provider-services", data);

// ─── PUT update a service offering (provider) ─────────────────────────────────
// body: { serviceName?, description?, price?, pricingType?, isActive? }
export const updateProviderService = (id, data) =>
  axiosInstance.put(`/provider-services/${id}`, data);

// ─── DELETE remove a service offering (provider) ──────────────────────────────
export const deleteProviderService = (id) =>
  axiosInstance.delete(`/provider-services/${id}`);
