const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },
    // providerId references ProviderProfile._id (mirrors Booking.providerId)
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      required: [true, "Provider profile is required"],
    },
    // Each booking can have exactly one review (unique index enforces rule #4)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
      unique: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number between 1 and 5",
      },
    },
    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
reviewSchema.index({ providerId: 1, createdAt: -1 }); // fast provider review listing
reviewSchema.index({ customerId: 1 });                 // customer's own reviews
// bookingId unique index is auto-created by unique: true above

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
