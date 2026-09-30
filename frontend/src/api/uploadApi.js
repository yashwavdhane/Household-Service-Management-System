import axiosInstance from "./axiosInstance";

// ─── POST upload profile image ────────────────────────────────────────────────
// Accepts a FormData object containing the image file
export const uploadImage = (formData) =>
  axiosInstance.post("/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
