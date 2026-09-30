const Review = require("../models/Review");
const Booking = require("../models/Booking");
const ProviderProfile = require("../models/ProviderProfile");

// ─── Helper: recalculate and save averageRating + totalReviews ────────────────
// Uses an aggregation so the calculation is always accurate regardless of order.
const recalcProviderRating = async (providerId) => {
  const agg = await Review.aggregate([
    { $match: { providerId: providerId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const avg   = agg[0]?.avg   ?? 0;
  const count = agg[0]?.count ?? 0;

  await ProviderProfile.findByIdAndUpdate(providerId, {
    averageRating: Math.round(avg * 10) / 10, // one decimal place
    totalReviews:  count,
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/reviews
// @desc   Customer submits a review for a completed booking
// @access Customer only
// Body: { bookingId, rating, comment }
// ═══════════════════════════════════════════════════════════════════════════════
const createReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  // ── Validate input ──────────────────────────────────────────────────────────
  if (!bookingId || !rating) {
    res.status(400);
    throw new Error("bookingId and rating are required");
  }

  const parsedRating = parseInt(rating, 10);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    res.status(400);
    throw new Error("Rating must be a whole number between 1 and 5");
  }

  // ── Load and validate the booking ──────────────────────────────────────────
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Rule 3: customer can only review their own booking
  if (booking.customerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only review your own bookings");
  }

  // Rule 2: booking must be completed
  if (booking.status !== "completed") {
    res.status(400);
    throw new Error("You can only review a completed booking");
  }

  // Rule 4: one review per booking (DB unique index also enforces this)
  const existing = await Review.findOne({ bookingId });
  if (existing) {
    res.status(400);
    throw new Error("You have already submitted a review for this booking");
  }

  // ── Create the review ───────────────────────────────────────────────────────
  const review = await Review.create({
    customerId: req.user._id,
    providerId: booking.providerId, // ProviderProfile._id
    bookingId,
    rating: parsedRating,
    comment: comment?.trim() || "",
  });

  // ── Rule 6: recalculate provider's averageRating and totalReviews ───────────
  await recalcProviderRating(booking.providerId);

  // Populate for the response
  const populated = await Review.findById(review._id)
    .populate("customerId", "name profileImage");

  res.status(201).json({
    success: true,
    message: "Review submitted successfully",
    review: populated,
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/reviews/provider/:providerId
// @desc   Get all reviews for a provider (paginated)
// @access Public
// Query: ?page=1&limit=10
// ═══════════════════════════════════════════════════════════════════════════════
const getProviderReviews = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip  = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ providerId: req.params.providerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customerId", "name profileImage"),
    Review.countDocuments({ providerId: req.params.providerId }),
  ]);

  res.status(200).json({
    success: true,
    reviews,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/reviews/booking/:bookingId
// @desc   Check if a review exists for a specific booking (for the review form)
// @access Protected (customer/admin)
// ═══════════════════════════════════════════════════════════════════════════════
const getBookingReview = async (req, res) => {
  const review = await Review.findOne({ bookingId: req.params.bookingId })
    .populate("customerId", "name profileImage");

  res.status(200).json({
    success: true,
    review: review || null,
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/reviews/:id
// @desc   Admin removes an inappropriate review; rating is recalculated
// @access Admin only
// ═══════════════════════════════════════════════════════════════════════════════
const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  const { providerId } = review;
  await review.deleteOne();

  // Recalculate provider's rating after removal
  await recalcProviderRating(providerId);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
};

module.exports = { createReview, getProviderReviews, getBookingReview, deleteReview };
