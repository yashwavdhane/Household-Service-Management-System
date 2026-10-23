const crypto = require('crypto');
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendOtpEmail } = require("../utils/mailer");

// ─── Helper: build auth response ─────────────────────────────────────────────
const authResponse = (res, statusCode, user, token) => {
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublicJSON(),
  });
};

// ─── @route  POST /api/auth/register ─────────────────────────────────────────
// @desc   Register a new customer or provider (admin not allowed publicly)
// @access Public
const register = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // ── Validation ──
  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error('Name, email, phone, and password are required');
  }
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  // Block public admin registration
  if (role === "admin") {
    res.status(403);
    throw new Error("Admin accounts cannot be created through public registration");
  }

  // Validate role (only customer or provider allowed)
  const allowedRoles = ["customer", "provider"];
  const assignedRole = role && allowedRoles.includes(role) ? role : "customer";

  // Check for duplicate email
  const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }] });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email or phone already exists");
  }

  // Create user (password hashed by pre-save hook)
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    password,
    role: assignedRole,
  });

  const token = generateToken(user._id);
  authResponse(res, 201, user, token);
};

// ─── @route  POST /api/auth/login ────────────────────────────────────────────
// @desc   Login with email and password
// @access Public
const login = async (req, res) => {
  const { email, password } = req.body;

  // ── Validation ──
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  // Find user with password field (select: false by default)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Check if account is active
  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Contact support.");
  }

  const token = generateToken(user._id);
  authResponse(res, 200, user, token);
};

// ─── @route  GET /api/auth/profile ───────────────────────────────────────────
// @desc   Get current logged-in user's profile
// @access Protected (any role)
const getProfile = async (req, res) => {
  // req.user is already populated by the protect middleware
  res.status(200).json({
    success: true,
    user: req.user.toPublicJSON(),
  });
};

// ─── @route  PUT /api/auth/profile ───────────────────────────────────────────
// @desc   Update current user's name, phone, or profileImage
// @access Protected (any role)
const updateProfile = async (req, res) => {
  const { name, phone, profileImage, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  // ── Update basic fields ──
  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (profileImage !== undefined) user.profileImage = profileImage.trim();

  // ── Update address fields (Customer) ──
  const { flatStreet, area, city, state, pinCode } = req.body;
  if (flatStreet !== undefined || area !== undefined || city !== undefined || state !== undefined || pinCode !== undefined) {
    user.address = {
      flatStreet: flatStreet !== undefined ? flatStreet.trim() : user.address?.flatStreet || "",
      area: area !== undefined ? area.trim() : user.address?.area || "",
      city: city !== undefined ? city.trim() : user.address?.city || "",
      state: state !== undefined ? state.trim() : user.address?.state || "",
      pinCode: pinCode !== undefined ? pinCode.trim() : user.address?.pinCode || "",
    };
  }

  // ── Password change (optional) ──
  if (newPassword) {
    if (!currentPassword) {
      res.status(400);
      throw new Error("Current password is required to set a new password");
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error("Current password is incorrect");
    }
    if (newPassword.length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters");
    }
    user.password = newPassword; // will be re-hashed by pre-save hook
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: user.toPublicJSON(),
  });
};


// ─── @route  POST /api/auth/forgot-password ──────────────────────────────────
// @desc   Generate OTP for forgot password using mobile number
// @access Public
const forgotPassword = async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400);
    throw new Error("Phone number is required");
  }

  const user = await User.findOne({ phone: phone.trim() });
  if (!user) {
    res.status(404);
    throw new Error("No user found with this phone number");
  }

  // Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP with SHA-256 before storing in database
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  user.resetOtp = hashedOtp;
  user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.resetOtpAttempts = 0; // reset failed attempt counter
  await user.save();

  // If user has an email, dispatch OTP email asynchronously
  if (user.email) {
    sendOtpEmail({ to: user.email, name: user.name, otp }).catch((err) =>
      console.error("[Mailer] Failed to dispatch OTP email:", err.message)
    );
  }

  // Console log simulation (essential for local dev / testing)
  console.log(`\n🔑 [OTP DISPATCH] To Phone: ${phone} | User: ${user.name} | OTP: ${otp} (valid for 10m)\n`);

  res.status(200).json({
    success: true,
    message: "OTP sent to your registered mobile number and email",
  });
};

// ─── @route  POST /api/auth/reset-password ───────────────────────────────────
// @desc   Reset password using OTP
// @access Public
const resetPassword = async (req, res) => {
  const { phone, otp, newPassword } = req.body;
  if (!phone || !otp || !newPassword) {
    res.status(400);
    throw new Error("Phone, OTP, and new password are required");
  }

  // Explicitly select hidden OTP fields
  const user = await User.findOne({ phone: phone.trim() }).select(
    "+resetOtp +resetOtpExpiry +resetOtpAttempts +password"
  );

  if (!user || !user.resetOtp || !user.resetOtpExpiry) {
    res.status(400);
    throw new Error("No active OTP request found. Please request a new OTP");
  }

  // Check if OTP has expired
  if (new Date(user.resetOtpExpiry).getTime() < Date.now()) {
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    await user.save();
    res.status(400);
    throw new Error("OTP has expired. Please request a new OTP");
  }

  // Check if user exceeded max 5 attempts to prevent brute force
  if (user.resetOtpAttempts >= 5) {
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    await user.save();
    res.status(429);
    throw new Error("Too many failed attempts. For security, please request a new OTP");
  }

  // Hash user-provided OTP and verify against database hash
  const hashedInputOtp = crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
  if (user.resetOtp !== hashedInputOtp) {
    user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
    await user.save();
    const attemptsLeft = 5 - user.resetOtpAttempts;
    res.status(400);
    throw new Error(
      `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`
    );
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  // Update password and clear OTP fields
  user.password = newPassword;
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  user.resetOtpAttempts = 0;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful. You can now log in with your new password.",
  });
};

module.exports = { register, login, getProfile, updateProfile, forgotPassword, resetPassword };
