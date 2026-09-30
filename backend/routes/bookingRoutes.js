const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getCustomerStats,
  getProviderStats,
} = require("../controllers/bookingController");
const { protect, authorize } = require("../middleware/auth");

// All booking routes require authentication
router.use(protect);

// ─── Customer: create booking ─────────────────────────────────────────────────
router.post("/", authorize("customer"), createBooking);

// ─── Customer: dashboard stats (must be before /:id) ─────────────────────────
router.get("/stats", authorize("customer"), getCustomerStats);

// ─── Provider: dashboard stats (must be before /:id) ─────────────────────────
router.get("/provider-stats", authorize("provider"), getProviderStats);

// ─── Customer + Provider + Admin: view own bookings ──────────────────────────
router.get("/my-bookings", authorize("customer", "provider", "admin"), getMyBookings);

// ─── All roles: get single booking (controller enforces ownership) ────────────
router.get("/:id", authorize("customer", "provider", "admin"), getBookingById);

// ─── Provider + Admin: update status ─────────────────────────────────────────
router.put("/:id/status", authorize("provider", "admin"), updateBookingStatus);

// ─── Customer + Admin: cancel booking ────────────────────────────────────────
router.put("/:id/cancel", authorize("customer", "admin"), cancelBooking);

module.exports = router;

