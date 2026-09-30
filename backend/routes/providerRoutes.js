const express = require("express");
const router = express.Router();
const {
  getProviders,
  getProviderById,
  getMyProfile,
  updateMyProfile,
  updateAvailability,
} = require("../controllers/providerController");
const { protect, authorize } = require("../middleware/auth");

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/", getProviders);

// ─── Provider-only (must come BEFORE /:id to avoid "me" being treated as an ID)
router.get("/me", protect, authorize("provider"), getMyProfile);
router.put("/profile", protect, authorize("provider"), updateMyProfile);
router.put("/availability", protect, authorize("provider"), updateAvailability);

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/:id", getProviderById);

module.exports = router;
