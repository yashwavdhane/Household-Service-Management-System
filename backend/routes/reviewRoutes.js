const express = require("express");
const router = express.Router();
const {
  createReview,
  getProviderReviews,
  getBookingReview,
  deleteReview,
} = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/auth");

// ── Public ─────────────────────────────────────────────────────────────────────
// Anyone can read provider reviews (shown on provider detail page)
router.get("/provider/:providerId", getProviderReviews);

// ── Protected: Customer & Admin ────────────────────────────────────────────────
// Check if a review already exists for a specific booking
router.get("/booking/:bookingId", protect, authorize("customer", "admin"), getBookingReview);

// ── Protected: Customer only ───────────────────────────────────────────────────
router.post("/", protect, authorize("customer"), createReview);

// ── Protected: Admin only ─────────────────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), deleteReview);

module.exports = router;
