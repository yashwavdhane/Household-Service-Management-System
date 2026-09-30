const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/auth");

// ─── Public ───────────────────────────────────────────────────────────────────
// Admin sees all (active + inactive); others see active only
// protect is optional here so we can pass req.user for the admin filter
router.get("/", (req, res, next) => {
  // Attach user if token present (optional auth)
  const jwt = require("jsonwebtoken");
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const User = require("../models/User");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      User.findById(decoded.id)
        .select("-password")
        .then((user) => {
          if (user) req.user = user;
          next();
        })
        .catch(() => next());
    } catch {
      next();
    }
  } else {
    next();
  }
}, getCategories);

router.get("/:id", getCategoryById);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.post("/", protect, authorize("admin"), createCategory);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;
