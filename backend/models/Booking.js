const mongoose = require("mongoose");

// ─── Valid status transitions ─────────────────────────────────────────────────
// Defines which statuses a current status can move to, and who can do it.
const STATUS_TRANSITIONS = {
  pending:     { provider: ["accepted", "rejected"], customer: ["cancelled"], admin: ["cancelled", "rejected"] },
  accepted:    { provider: ["in_progress", "rejected"], customer: ["cancelled"], admin: ["cancelled"] },
  in_progress: { provider: ["completed"], customer: [], admin: ["cancelled"] },
  completed:   { provider: [], customer: [], admin: [] },
  cancelled:   { provider: [], customer: [], admin: [] },
  rejected:    { provider: [], customer: [], admin: [] },
};

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },
    // providerId stores the ProviderProfile._id (not User._id)
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      required: [true, "Provider is required"],
    },
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: [true, "Service category is required"],
    },
    bookingDate: {
      type: String, // stored as "YYYY-MM-DD" string for simplicity
      required: [true, "Booking date is required"],
      trim: true,
    },
    bookingTime: {
      type: String, // stored as "HH:MM" string
      required: [true, "Booking time is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Service address is required"],
      trim: true,
      maxlength: [300, "Address cannot exceed 300 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "accepted", "in_progress", "completed", "cancelled", "rejected"],
        message: "Invalid booking status",
      },
      default: "pending",
    },
    estimatedPrice: {
      type: Number,
      default: null,
      min: [0, "Price cannot be negative"],
    },
    finalPrice: {
      type: Number,
      default: null,
      min: [0, "Price cannot be negative"],
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ providerId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

// ─── Static: validate a status transition ────────────────────────────────────
bookingSchema.statics.canTransition = function (currentStatus, newStatus, role) {
  const allowed = STATUS_TRANSITIONS[currentStatus]?.[role] || [];
  return allowed.includes(newStatus);
};

// ─── Static: get allowed next statuses for a role ────────────────────────────
bookingSchema.statics.allowedTransitions = function (currentStatus, role) {
  return STATUS_TRANSITIONS[currentStatus]?.[role] || [];
};

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
