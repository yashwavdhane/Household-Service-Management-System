const mongoose = require("mongoose");

/**
 * ProviderService — a specific service offered by a provider at their own price.
 * Each record links a provider to an admin-managed service category,
 * with provider-specific name, description, price, and pricing type.
 *
 * Business rules enforced here:
 *  - A provider cannot have two active offerings for the same serviceCategoryId.
 *  - Deactivating (isActive = false) preserves historical booking data.
 */
const providerServiceSchema = new mongoose.Schema(
  {
    // References ProviderProfile._id (mirrors Booking.providerId convention)
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      required: [true, "Provider profile is required"],
    },
    // References the Admin-managed global category
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: [true, "Service category is required"],
    },
    // Provider-specific service name (can be more specific than category)
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      maxlength: [120, "Service name cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    // Price in INR (always stored as a number)
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    // Pricing unit — determines how the price is displayed
    pricingType: {
      type: String,
      enum: {
        values: ["per_visit", "per_hour", "fixed"],
        message: "pricingType must be per_visit, per_hour, or fixed",
      },
      default: "per_visit",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
providerServiceSchema.index({ providerId: 1, isActive: 1 });
providerServiceSchema.index({ providerId: 1, serviceCategoryId: 1 });
providerServiceSchema.index({ serviceCategoryId: 1 });

// ─── Prevent duplicate active offerings for same provider + category ──────────
// This is a partial unique index: unique only where isActive = true
providerServiceSchema.index(
  { providerId: 1, serviceCategoryId: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: "unique_active_provider_category",
  }
);

const ProviderService = mongoose.model("ProviderService", providerServiceSchema);
module.exports = ProviderService;
