const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile, forgotPassword, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// ─── Public routes ────────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ─── Protected routes (requires valid JWT) ────────────────────────────────────
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// ─── Logout (client-side token removal) ──────────────────────────────────────
// JWT is stateless — logout is handled by removing the token on the frontend.
// This endpoint exists for consistency and future refresh-token support.
router.post("/logout", protect, (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

module.exports = router;
