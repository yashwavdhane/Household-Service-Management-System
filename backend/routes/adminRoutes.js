const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getProviders,
  updateProviderVerification,
  getAllBookings,
  getAnalytics,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

// ── All admin routes require authentication AND admin role ─────────────────────
router.use(protect);
router.use(authorize("admin"));

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get("/dashboard", getDashboardStats);

// ── Analytics ──────────────────────────────────────────────────────────────────
router.get("/analytics", getAnalytics);

// ── Users ──────────────────────────────────────────────────────────────────────
router.get("/users", getUsers);
router.put("/users/:id/status", updateUserStatus);

// ── Providers ─────────────────────────────────────────────────────────────────
router.get("/providers", getProviders);
router.put("/providers/:id/verify", updateProviderVerification);

// ── Bookings ──────────────────────────────────────────────────────────────────
router.get("/bookings", getAllBookings);

module.exports = router;
