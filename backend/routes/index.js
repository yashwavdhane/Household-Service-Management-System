const express = require("express");
const router = express.Router();

// ─── Health Check ─────────────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "Household Service Management System API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── Route Mounts ────────────────────────────────────────────────────────────
router.use("/auth",       require("./authRoutes"));
router.use("/categories", require("./categoryRoutes"));
router.use("/providers",  require("./providerRoutes"));
router.use("/bookings",   require("./bookingRoutes"));
router.use("/admin",      require("./adminRoutes"));
router.use("/reviews",    require("./reviewRoutes"));
router.use("/notifications", require("./notificationRoutes"));
router.use("/upload",        require("./uploadRoutes"));


module.exports = router;
