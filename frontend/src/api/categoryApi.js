import axiosInstance from "./axiosInstance";

// ─── GET all categories (public; admin sees inactive too) ─────────────────────
export const fetchCategories = () => axiosInstance.get("/categories");

// ─── GET single category ──────────────────────────────────────────────────────
export const fetchCategoryById = (id) => axiosInstance.get(`/categories/${id}`);

// ─── POST create category (admin) ────────────────────────────────────────────
export const createCategory = (data) => axiosInstance.post("/categories", data);

// ─── PUT update category (admin) ─────────────────────────────────────────────
export const updateCategory = (id, data) => axiosInstance.put(`/categories/${id}`, data);

// ─── DELETE category (admin) ─────────────────────────────────────────────────
export const deleteCategory = (id) => axiosInstance.delete(`/categories/${id}`);
