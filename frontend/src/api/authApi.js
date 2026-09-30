import axiosInstance from "./axiosInstance";

/**
 * Update the logged-in user's profile (name, phone, profileImage).
 * The backend verifies the user from the JWT.
 */
export const updateProfile = (data) => {
  return axiosInstance.put("/auth/profile", data);
};
