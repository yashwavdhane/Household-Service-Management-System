const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");

// ─── Shared: build populated provider query ───────────────────────────────────
const populateProvider = (query) =>
  query
    .populate("userId", "name email phone profileImage isActive")
    .populate("serviceCategories", "name image description");

// ─── GET /api/providers ───────────────────────────────────────────────────────
// @desc   List providers with optional filtering
// @access Public
const getProviders = async (req, res) => {
  const { category, serviceArea, rating, available } = req.query;

  const filter = {};

  // Filter by service category ID
  if (category) filter.serviceCategories = category;

  // Filter by service area (case-insensitive partial match)
  if (serviceArea) filter.serviceArea = { $regex: serviceArea, $options: "i" };

  // Filter by minimum average rating
  if (rating) filter.averageRating = { $gte: parseFloat(rating) };

  // Filter by availability
  if (available === "true") filter.availability = true;

  const profiles = await populateProvider(ProviderProfile.find(filter)).sort({
    averageRating: -1,
    createdAt: -1,
  });

  // Exclude providers whose user account is inactive
  const active = profiles.filter((p) => p.userId?.isActive);

  res.status(200).json({ success: true, count: active.length, providers: active });
};

// ─── GET /api/providers/:id ───────────────────────────────────────────────────
// @access Public
const getProviderById = async (req, res) => {
  const profile = await populateProvider(
    ProviderProfile.findById(req.params.id)
  );
  if (!profile || !profile.userId?.isActive) {
    res.status(404);
    throw new Error("Provider not found");
  }
  res.status(200).json({ success: true, provider: profile });
};

// ─── GET /api/providers/me ────────────────────────────────────────────────────
// @desc   Get the current provider's own profile (creates one if none exists)
// @access Provider only
const getMyProfile = async (req, res) => {
  let profile = await populateProvider(
    ProviderProfile.findOne({ userId: req.user._id })
  );

  if (!profile) {
    // Auto-create an empty profile for the provider on first access
    profile = await ProviderProfile.create({ userId: req.user._id });
    profile = await populateProvider(
      ProviderProfile.findById(profile._id)
    );
  }

  res.status(200).json({ success: true, provider: profile });
};

// ─── PUT /api/providers/profile ──────────────────────────────────────────────
// @desc   Create or update provider's professional profile
// @access Provider only
const updateMyProfile = async (req, res) => {
  const { serviceCategories, skills, experience, description, serviceArea } = req.body;

  const updateData = {};
  if (serviceCategories !== undefined) updateData.serviceCategories = serviceCategories;
  if (skills !== undefined) {
    // Accept comma-separated string or array
    updateData.skills = Array.isArray(skills)
      ? skills.map((s) => s.trim()).filter(Boolean)
      : skills.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (experience !== undefined) {
    const exp = parseInt(experience);
    if (isNaN(exp) || exp < 0) {
      res.status(400);
      throw new Error("Experience must be a non-negative number");
    }
    updateData.experience = exp;
  }
  if (description !== undefined) updateData.description = description.trim();
  if (serviceArea !== undefined) updateData.serviceArea = serviceArea.trim();

  const profile = await ProviderProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: updateData },
    { new: true, upsert: true, runValidators: true }
  );

  const populated = await populateProvider(ProviderProfile.findById(profile._id));
  res.status(200).json({ success: true, message: "Profile updated", provider: populated });
};

// ─── PUT /api/providers/availability ─────────────────────────────────────────
// @desc   Toggle provider availability
// @access Provider only
const updateAvailability = async (req, res) => {
  const { availability } = req.body;
  if (typeof availability !== "boolean") {
    res.status(400);
    throw new Error("Availability must be a boolean (true or false)");
  }

  const profile = await ProviderProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { availability } },
    { new: true, upsert: true }
  );

  res.status(200).json({
    success: true,
    message: `You are now ${availability ? "available" : "unavailable"} for bookings`,
    availability: profile.availability,
  });
};

module.exports = { getProviders, getProviderById, getMyProfile, updateMyProfile, updateAvailability };
