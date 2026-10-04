const express = require("express");
const router = express.Router();
const {
  getProviderServices,
  getMyServices,
  createProviderService,
  updateProviderService,
  deleteProviderService,
  getProviderServiceById,
} = require("../controllers/providerServiceController");
const { protect, authorize } = require("../middleware/auth");

// ─── Public: list services (optionally filtered) ──────────────────────────────
router.get("/", getProviderServices);

// ─── Provider only: manage own services ──────────────────────────────────────
// Must come BEFORE /:id to avoid "my-services" matching as an ID
router.get("/my-services", protect, authorize("provider"), getMyServices);
router.post("/", protect, authorize("provider"), createProviderService);
router.put("/:id", protect, authorize("provider"), updateProviderService);
router.delete("/:id", protect, authorize("provider"), deleteProviderService);

// ─── Public: single service ───────────────────────────────────────────────────
router.get("/:id", getProviderServiceById);

module.exports = router;
