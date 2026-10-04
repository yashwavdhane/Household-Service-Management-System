const ProviderService = require("../models/ProviderService");
const ProviderProfile = require("../models/ProviderProfile");
const ServiceCategory = require("../models/ServiceCategory");
const mongoose = require("mongoose");

// ─── Helper: populate a provider service query ────────────────────────────────
const populateService = (query) =>
  query
    .populate("serviceCategoryId", "name image description isActive")
    .populate({
      path: "providerId",
      select: "userId availability isVerified",
      populate: { path: "userId", select: "name email profileImage" },
    });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/provider-services?providerId=xxx&categoryId=xxx&activeOnly=true
// @desc   List provider services (public)
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
const getProviderServices = async (req, res) => {
  const { providerId, categoryId, activeOnly } = req.query;

  const filter = {};
  if (providerId) {
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      res.status(400);
      throw new Error("Invalid providerId format");
    }
    filter.providerId = providerId;
  }
  if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      res.status(400);
      throw new Error("Invalid categoryId format");
    }
    filter.serviceCategoryId = categoryId;
  }
  // Default: show only active services for public listing
  if (activeOnly !== "false") {
    filter.isActive = true;
  }

  const services = await populateService(
    ProviderService.find(filter).sort({ createdAt: -1 })
  );

  res.status(200).json({ success: true, count: services.length, services });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/provider-services/my-services
// @desc   List the logged-in provider's own services (all, including inactive)
// @access Provider only
// ─────────────────────────────────────────────────────────────────────────────
const getMyServices = async (req, res) => {
  const profile = await ProviderProfile.findOne({ userId: req.user._id });
  if (!profile) {
    return res.status(200).json({ success: true, count: 0, services: [] });
  }

  const services = await populateService(
    ProviderService.find({ providerId: profile._id }).sort({ isActive: -1, createdAt: -1 })
  );

  res.status(200).json({ success: true, count: services.length, services });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/provider-services
// @desc   Provider adds a new service offering
// @access Provider only
// ─────────────────────────────────────────────────────────────────────────────
const createProviderService = async (req, res) => {
  const { serviceCategoryId, serviceName, description, price, pricingType } = req.body;

  // ── Basic validation ────────────────────────────────────────────────────────
  if (!serviceCategoryId || !serviceName || price === undefined || price === null) {
    res.status(400);
    throw new Error("serviceCategoryId, serviceName, and price are required");
  }
  if (!mongoose.Types.ObjectId.isValid(serviceCategoryId)) {
    res.status(400);
    throw new Error("Invalid serviceCategoryId format");
  }
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    res.status(400);
    throw new Error("Price must be a non-negative number");
  }

  // ── Verify the service category exists and is active ───────────────────────
  const category = await ServiceCategory.findById(serviceCategoryId);
  if (!category || !category.isActive) {
    res.status(404);
    throw new Error("Service category not found or is inactive");
  }

  // ── Get provider profile ───────────────────────────────────────────────────
  let profile = await ProviderProfile.findOne({ userId: req.user._id });
  if (!profile) {
    // Auto-create profile on first service
    profile = await ProviderProfile.create({ userId: req.user._id });
  }

  // ── Check for existing active offering for same category ───────────────────
  const existing = await ProviderService.findOne({
    providerId: profile._id,
    serviceCategoryId,
    isActive: true,
  });
  if (existing) {
    res.status(400);
    throw new Error(
      "You already have an active service offering for this category. Edit the existing one or deactivate it first."
    );
  }

  // ── Create the service ─────────────────────────────────────────────────────
  const service = await ProviderService.create({
    providerId: profile._id,
    serviceCategoryId,
    serviceName: serviceName.trim(),
    description: description?.trim() || "",
    price: parsedPrice,
    pricingType: pricingType || "per_visit",
    isActive: true,
  });

  // Also add this category to provider's serviceCategories if not already there
  if (!profile.serviceCategories.map(c => c.toString()).includes(serviceCategoryId.toString())) {
    await ProviderProfile.findByIdAndUpdate(profile._id, {
      $addToSet: { serviceCategories: serviceCategoryId },
    });
  }

  const populated = await populateService(ProviderService.findById(service._id));

  res.status(201).json({
    success: true,
    message: "Service offering created successfully",
    service: populated,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/provider-services/:id
// @desc   Provider edits their own service offering
// @access Provider only (must own the service)
// ─────────────────────────────────────────────────────────────────────────────
const updateProviderService = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid service ID");
  }

  const service = await ProviderService.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Service offering not found");
  }

  // Ownership check
  const profile = await ProviderProfile.findOne({ userId: req.user._id });
  if (!profile || service.providerId.toString() !== profile._id.toString()) {
    res.status(403);
    throw new Error("Access denied — you do not own this service offering");
  }

  const { serviceName, description, price, pricingType, isActive } = req.body;

  const updateData = {};
  if (serviceName !== undefined) updateData.serviceName = serviceName.trim();
  if (description !== undefined) updateData.description = description.trim();
  if (price !== undefined) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400);
      throw new Error("Price must be a non-negative number");
    }
    updateData.price = parsedPrice;
  }
  if (pricingType !== undefined) {
    if (!["per_visit", "per_hour", "fixed"].includes(pricingType)) {
      res.status(400);
      throw new Error("pricingType must be per_visit, per_hour, or fixed");
    }
    updateData.pricingType = pricingType;
  }
  if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
  }

  // If re-activating, check for existing active duplicate
  if (updateData.isActive === true && !service.isActive) {
    const duplicate = await ProviderService.findOne({
      providerId: profile._id,
      serviceCategoryId: service.serviceCategoryId,
      isActive: true,
      _id: { $ne: service._id },
    });
    if (duplicate) {
      res.status(400);
      throw new Error(
        "You already have an active offering for this category. Deactivate it before re-activating this one."
      );
    }
  }

  const updated = await ProviderService.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  const populated = await populateService(ProviderService.findById(updated._id));

  res.status(200).json({
    success: true,
    message: "Service offering updated",
    service: populated,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/provider-services/:id
// @desc   Provider removes a service offering (soft-deactivate if bookings exist, else hard delete)
// @access Provider only
// ─────────────────────────────────────────────────────────────────────────────
const deleteProviderService = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid service ID");
  }

  const service = await ProviderService.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Service offering not found");
  }

  // Ownership check
  const profile = await ProviderProfile.findOne({ userId: req.user._id });
  if (!profile || service.providerId.toString() !== profile._id.toString()) {
    res.status(403);
    throw new Error("Access denied — you do not own this service offering");
  }

  // Check if any bookings reference this service
  const Booking = require("../models/Booking");
  const bookingCount = await Booking.countDocuments({ providerServiceId: service._id });

  if (bookingCount > 0) {
    // Soft-delete: deactivate to preserve historical booking data
    await ProviderService.findByIdAndUpdate(req.params.id, { isActive: false });
    return res.status(200).json({
      success: true,
      message: `Service deactivated (${bookingCount} historical booking(s) preserved). It is no longer visible to customers.`,
    });
  }

  // Hard delete if no bookings reference it
  await service.deleteOne();
  res.status(200).json({
    success: true,
    message: "Service offering deleted successfully",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/provider-services/:id
// @desc   Get a single provider service (public)
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
const getProviderServiceById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid service ID");
  }
  const service = await populateService(ProviderService.findById(req.params.id));
  if (!service) {
    res.status(404);
    throw new Error("Service offering not found");
  }
  res.status(200).json({ success: true, service });
};

module.exports = {
  getProviderServices,
  getMyServices,
  createProviderService,
  updateProviderService,
  deleteProviderService,
  getProviderServiceById,
};
