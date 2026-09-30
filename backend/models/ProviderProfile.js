const mongoose = require("mongoose");

const providerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per provider
    },
    serviceCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceCategory",
      },
    ],
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number, // years of experience
      default: 0,
      min: [0, "Experience cannot be negative"],
      max: [60, "Experience value is too large"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    serviceArea: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Service area cannot exceed 200 characters"],
    },
    availability: {
      type: Boolean,
      default: true, // true = available for new bookings
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVerified: {
      type: Boolean,
      default: false, // admin verifies providers
    },
  },
  { timestamps: true }
);

// Index for fast filtering queries
providerProfileSchema.index({ serviceCategories: 1 });
providerProfileSchema.index({ serviceArea: "text" });
providerProfileSchema.index({ averageRating: -1 });
providerProfileSchema.index({ availability: 1 });

const ProviderProfile = mongoose.model("ProviderProfile", providerProfileSchema);
module.exports = ProviderProfile;
