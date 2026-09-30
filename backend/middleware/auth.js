const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── protect ─────────────────────────────────────────────────────────────────
/**
 * Verifies JWT from Authorization header and attaches user to req.user.
 * Blocks inactive users from accessing protected features.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized — no token provided");
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Not authorized — token is invalid or expired");
  }

  // Fetch user (exclude password)
  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    res.status(401);
    throw new Error("Not authorized — user no longer exists");
  }

  // Block inactive users
  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Contact support.");
  }

  req.user = user;
  next();
};

// ─── authorize ───────────────────────────────────────────────────────────────
/**
 * Role-based authorization middleware factory.
 * Usage: router.get("/admin-only", protect, authorize("admin"), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Access denied — role '${req.user.role}' is not authorized for this action`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
