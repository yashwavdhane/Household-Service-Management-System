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
    // ── Legacy single-field service area (kept for backwards compat) ──────────
    serviceArea: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Service area cannot exceed 200 characters"],
    },
    // ── Structured address fields ─────────────────────────────────────────────
    address: {
      flatStreet: {
        type: String,
        trim: true,
        default: "",
        maxlength: [200, "Street address cannot exceed 200 characters"],
      },
      area: {
        type: String,
        trim: true,
        default: "",
        maxlength: [100, "Area/Locality cannot exceed 100 characters"],
      },
      city: {
        type: String,
        trim: true,
        default: "",
        maxlength: [100, "City cannot exceed 100 characters"],
      },
      state: {
        type: String,
        trim: true,
        default: "",
        maxlength: [100, "State cannot exceed 100 characters"],
      },
      pinCode: {
        type: String,
        trim: true,
        default: "",
        match: [/^(\d{6})?$/, "PIN code must be exactly 6 digits"],
      },
      landmark: {
        type: String,
        trim: true,
        default: "",
        maxlength: [200, "Landmark cannot exceed 200 characters"],
      },
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
providerProfileSchema.index({ "address.pinCode": 1 }); // fast PIN code lookups

const ProviderProfile = mongoose.model("ProviderProfile", providerProfileSchema);
module.exports = ProviderProfile;
