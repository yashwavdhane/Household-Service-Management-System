const crypto = require('crypto');
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

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
    throw new Error('Phone number is required');
  }

  const user = await User.findOne({ phone: phone.trim() });
  if (!user) {
    res.status(404);
    throw new Error('No user found with this phone number');
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 10 minutes
  user.resetOtp = otp;
  user.resetOtpExpiry = Date.now() + 10 * 60 * 1000;
  await user.save();

  // Simulate sending SMS
  console.log(`[OTP SMS SIMULATION] To: ${phone} | OTP: ${otp}`);

  res.status(200).json({
    success: true,
    message: 'OTP sent to mobile number',
  });
};

// ─── @route  POST /api/auth/reset-password ───────────────────────────────────
// @desc   Reset password using OTP
// @access Public
const resetPassword = async (req, res) => {
  const { phone, otp, newPassword } = req.body;
  if (!phone || !otp || !newPassword) {
    res.status(400);
    throw new Error('Phone, OTP, and new password are required');
  }

  const user = await User.findOne({
    phone: phone.trim(),
    resetOtp: otp,
    resetOtpExpiry: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.password = newPassword;
  user.resetOtp = undefined;
  user.resetOtpExpiry = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
};

module.exports = { register, login, getProfile, updateProfile, forgotPassword, resetPassword };
