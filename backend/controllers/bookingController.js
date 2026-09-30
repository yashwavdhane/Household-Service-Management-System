const Booking = require("../models/Booking");
const ProviderProfile = require("../models/ProviderProfile");
const ServiceCategory = require("../models/ServiceCategory");
const Notification = require("../models/Notification");

// ─── Helper: populate a booking query ────────────────────────────────────────
const populateBooking = (query) =>
  query
    .populate("customerId", "name email phone profileImage")
    .populate({
      path: "providerId",
      select: "userId serviceCategories experience serviceArea averageRating isVerified",
      populate: { path: "userId", select: "name email phone profileImage" },
    })
    .populate("serviceCategoryId", "name image description");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bookings
// @desc   Customer creates a new booking (status = pending)
// @access Customer only
// ─────────────────────────────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  const { providerId, serviceCategoryId, bookingDate, bookingTime, address, description, estimatedPrice } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!providerId || !serviceCategoryId || !bookingDate || !bookingTime || !address) {
    res.status(400);
    throw new Error("Provider, service category, date, time, and address are all required");
  }

  // Validate date format YYYY-MM-DD and ensure it's not in the past
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(bookingDate)) {
    res.status(400);
    throw new Error("Booking date must be in YYYY-MM-DD format");
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (new Date(bookingDate) < today) {
    res.status(400);
    throw new Error("Booking date cannot be in the past");
  }

  // Validate time format HH:MM
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(bookingTime)) {
    res.status(400);
    throw new Error("Booking time must be in HH:MM (24-hour) format");
  }

  // Verify provider exists and is available
  const provider = await ProviderProfile.findById(providerId);
  if (!provider) {
    res.status(404);
    throw new Error("Provider not found");
  }
  if (!provider.availability) {
    res.status(400);
    throw new Error("This provider is currently unavailable for new bookings");
  }

  // Verify service category exists and is active
  const category = await ServiceCategory.findById(serviceCategoryId);
  if (!category || !category.isActive) {
    res.status(404);
    throw new Error("Service category not found or inactive");
  }

  // Verify provider offers this category
  const offersCategory = provider.serviceCategories.some(
    (c) => c.toString() === serviceCategoryId.toString()
  );
  if (!offersCategory) {
    res.status(400);
    throw new Error("This provider does not offer the selected service category");
  }

  // Create booking
  const booking = await Booking.create({
    customerId: req.user._id,
    providerId,
    serviceCategoryId,
    bookingDate,
    bookingTime,
    address: address.trim(),
    description: description?.trim() || "",
    estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : null,
    status: "pending",
  });

  const populated = await populateBooking(Booking.findById(booking._id));

  // ── Notify Provider ─────────────────────────────────────────────────────────
  await Notification.create({
    userId: provider.userId,
    title: "New Booking Request",
    message: `You have a new booking request for ${category.name} on ${bookingDate}.`,
    type: "booking",
  });

  res.status(201).json({ success: true, message: "Booking created successfully", booking: populated });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/my-bookings
// @desc   Get bookings for the logged-in user (customer sees own; provider sees theirs)
// @access Customer + Provider
// ─────────────────────────────────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  let filter = {};

  if (req.user.role === "customer") {
    filter = { customerId: req.user._id };
  } else if (req.user.role === "provider") {
    // Find this provider's ProviderProfile
    const profile = await ProviderProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(200).json({ success: true, count: 0, bookings: [] });
    }
    filter = { providerId: profile._id };
  } else if (req.user.role === "admin") {
    // Admin sees all bookings
    filter = {};
  }

  // Optional status filter
  const { status } = req.query;
  if (status && ["pending","accepted","in_progress","completed","cancelled","rejected"].includes(status)) {
    filter.status = status;
  }

  const bookings = await populateBooking(
    Booking.find(filter).sort({ createdAt: -1 })
  );

  res.status(200).json({ success: true, count: bookings.length, bookings });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/:id
// @desc   Get a single booking (only the involved customer or provider can view)
// @access Customer (own) + Provider (own) + Admin
// ─────────────────────────────────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  const booking = await populateBooking(Booking.findById(req.params.id));
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Ownership check
  const isCustomer  = booking.customerId?._id.toString() === req.user._id.toString();
  const isProvider  = booking.providerId?.userId?._id?.toString() === req.user._id.toString();
  const isAdmin     = req.user.role === "admin";

  if (!isCustomer && !isProvider && !isAdmin) {
    res.status(403);
    throw new Error("Access denied — you are not part of this booking");
  }

  res.status(200).json({ success: true, booking });
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/bookings/:id/status
// @desc   Provider updates booking status (accept/reject/in_progress/complete)
// @access Provider + Admin
// ─────────────────────────────────────────────────────────────────────────────
const updateBookingStatus = async (req, res) => {
  const { status, finalPrice } = req.body;

  if (!status) {
    res.status(400);
    throw new Error("New status is required");
  }

  const booking = await populateBooking(Booking.findById(req.params.id));
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Ownership check for providers
  if (req.user.role === "provider") {
    const isOwnBooking = booking.providerId?.userId?._id?.toString() === req.user._id.toString();
    if (!isOwnBooking) {
      res.status(403);
      throw new Error("Access denied — this booking is not assigned to you");
    }
  }

  // Validate transition
  const role = req.user.role === "admin" ? "admin" : "provider";
  if (!Booking.canTransition(booking.status, status, role)) {
    const allowed = Booking.allowedTransitions(booking.status, role);
    res.status(400);
    throw new Error(
      `Invalid status transition: '${booking.status}' → '${status}'. ` +
      (allowed.length > 0
        ? `Allowed: ${allowed.join(", ")}`
        : `No transitions allowed from '${booking.status}'`)
    );
  }

  // Update fields
  booking.status = status;
  if (status === "completed" && finalPrice !== undefined) {
    booking.finalPrice = parseFloat(finalPrice);
  }

  await booking.save();

  // Re-fetch with populate (save() doesn't re-populate)
  const updated = await populateBooking(Booking.findById(booking._id));

  // ── Notify Customer ────────────────────────────────────────────────────────
  let title = "";
  let message = "";
  let notifType = "info";

  if (status === "accepted") {
    title = "Booking Accepted";
    message = `Your booking for ${updated.serviceCategoryId.name} on ${updated.bookingDate} has been accepted.`;
    notifType = "success";
  } else if (status === "rejected") {
    title = "Booking Rejected";
    message = `Your booking for ${updated.serviceCategoryId.name} on ${updated.bookingDate} has been rejected.`;
    notifType = "error";
  } else if (status === "in_progress") {
    title = "Booking In Progress";
    message = `Your provider has started working on your booking for ${updated.serviceCategoryId.name}.`;
    notifType = "info";
  } else if (status === "completed") {
    title = "Booking Completed";
    message = `Your booking for ${updated.serviceCategoryId.name} has been completed. Don't forget to leave a review!`;
    notifType = "success";
  }

  if (title) {
    await Notification.create({
      userId: updated.customerId._id,
      title,
      message,
      type: notifType,
    });
  }

  res.status(200).json({ success: true, message: `Booking ${status}`, booking: updated });
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/bookings/:id/cancel
// @desc   Customer cancels their booking (only if pending or accepted)
// @access Customer + Admin
// ─────────────────────────────────────────────────────────────────────────────
const cancelBooking = async (req, res) => {
  const { cancellationReason } = req.body;

  const booking = await populateBooking(Booking.findById(req.params.id));
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Ownership check for customers
  if (req.user.role === "customer") {
    const isOwner = booking.customerId?._id.toString() === req.user._id.toString();
    if (!isOwner) {
      res.status(403);
      throw new Error("Access denied — this is not your booking");
    }
  }

  // Validate transition
  const role = req.user.role === "admin" ? "admin" : "customer";
  if (!Booking.canTransition(booking.status, "cancelled", role)) {
    const allowed = Booking.allowedTransitions(booking.status, role);
    res.status(400);
    throw new Error(
      `Cannot cancel a booking that is '${booking.status}'. ` +
      (allowed.includes("cancelled")
        ? ""
        : `Cancellation is only allowed from: pending or accepted status.`)
    );
  }

  booking.status = "cancelled";
  booking.cancellationReason = cancellationReason?.trim() || "";
  await booking.save();

  const updated = await populateBooking(Booking.findById(booking._id));

  // ── Notify relevant user ───────────────────────────────────────────────────
  if (req.user.role === "customer") {
    // Notify provider
    await Notification.create({
      userId: updated.providerId.userId._id, // because providerId is populated with userId
      title: "Booking Cancelled",
      message: `The customer has cancelled their booking for ${updated.serviceCategoryId.name} on ${updated.bookingDate}.`,
      type: "warning",
    });
  } else {
    // Admin or Provider cancelled -> Notify customer
    await Notification.create({
      userId: updated.customerId._id,
      title: "Booking Cancelled",
      message: `Your booking for ${updated.serviceCategoryId.name} on ${updated.bookingDate} has been cancelled.`,
      type: "error",
    });
  }

  res.status(200).json({ success: true, message: "Booking cancelled", booking: updated });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/stats
// @desc   Aggregated dashboard statistics for the logged-in customer
// @access Customer only
// Returns:
//   stats.total, stats.pending, stats.accepted, stats.in_progress,
//   stats.completed, stats.cancelled, stats.rejected, stats.totalSpent
//   recentBookings: last 5 populated bookings
// ─────────────────────────────────────────────────────────────────────────────
const getCustomerStats = async (req, res) => {
  const customerId = req.user._id;

  // ── Single aggregation: counts + totalSpent ────────────────────────────────
  const [agg] = await Booking.aggregate([
    { $match: { customerId } },
    {
      $facet: {
        total:       [{ $count: "count" }],
        pending:     [{ $match: { status: "pending" } },     { $count: "count" }],
        accepted:    [{ $match: { status: "accepted" } },    { $count: "count" }],
        in_progress: [{ $match: { status: "in_progress" } }, { $count: "count" }],
        completed:   [{ $match: { status: "completed" } },   { $count: "count" }],
        cancelled:   [{ $match: { status: "cancelled" } },   { $count: "count" }],
        rejected:    [{ $match: { status: "rejected" } },    { $count: "count" }],
        totalSpent: [
          { $match: { status: "completed", finalPrice: { $ne: null } } },
          { $group: { _id: null, sum: { $sum: "$finalPrice" } } },
        ],
      },
    },
  ]);

  // Helper: extract count from facet result
  const pick = (key) => agg?.[key]?.[0]?.count || 0;

  const stats = {
    total:       pick("total"),
    pending:     pick("pending"),
    accepted:    pick("accepted"),
    in_progress: pick("in_progress"),
    completed:   pick("completed"),
    cancelled:   pick("cancelled"),
    rejected:    pick("rejected"),
    totalSpent:  agg?.totalSpent?.[0]?.sum || 0,
  };

  // ── Recent bookings (last 5, fully populated) ─────────────────────────────
  const recentBookings = await populateBooking(
    Booking.find({ customerId }).sort({ createdAt: -1 }).limit(5)
  );

  res.status(200).json({ success: true, stats, recentBookings });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/provider-stats
// @desc   Aggregated dashboard statistics for the logged-in PROVIDER
// @access Provider only
// Returns:
//   stats.total, stats.pending, stats.accepted, stats.in_progress,
//   stats.completed, stats.cancelled, stats.rejected,
//   stats.totalEarned (sum of finalPrice on completed bookings)
//   profile.averageRating, profile.totalReviews, profile.availability, profile.isVerified
//   recentRequests: last 5 populated pending/accepted/in_progress bookings
// ─────────────────────────────────────────────────────────────────────────────
const getProviderStats = async (req, res) => {
  // Resolve provider's ProviderProfile
  const profile = await ProviderProfile.findOne({ userId: req.user._id })
    .populate("userId", "name email phone profileImage")
    .populate("serviceCategories", "name image");

  if (!profile) {
    // New provider — no profile yet, return zeroed stats
    return res.status(200).json({
      success: true,
      stats: { total: 0, pending: 0, accepted: 0, in_progress: 0, completed: 0, cancelled: 0, rejected: 0, totalEarned: 0 },
      profile: { averageRating: 0, totalReviews: 0, availability: true, isVerified: false, serviceCategories: [], skills: [], experience: 0, serviceArea: "", description: "" },
      recentRequests: [],
    });
  }

  const providerId = profile._id;

  // ── Single aggregation: booking counts + totalEarned ──────────────────────
  const [agg] = await Booking.aggregate([
    { $match: { providerId } },
    {
      $facet: {
        total:       [{ $count: "count" }],
        pending:     [{ $match: { status: "pending" } },     { $count: "count" }],
        accepted:    [{ $match: { status: "accepted" } },    { $count: "count" }],
        in_progress: [{ $match: { status: "in_progress" } }, { $count: "count" }],
        completed:   [{ $match: { status: "completed" } },   { $count: "count" }],
        cancelled:   [{ $match: { status: "cancelled" } },   { $count: "count" }],
        rejected:    [{ $match: { status: "rejected" } },    { $count: "count" }],
        totalEarned: [
          { $match: { status: "completed", finalPrice: { $ne: null } } },
          { $group: { _id: null, sum: { $sum: "$finalPrice" } } },
        ],
      },
    },
  ]);

  const pick = (key) => agg?.[key]?.[0]?.count || 0;

  const stats = {
    total:       pick("total"),
    pending:     pick("pending"),
    accepted:    pick("accepted"),
    in_progress: pick("in_progress"),
    completed:   pick("completed"),
    cancelled:   pick("cancelled"),
    rejected:    pick("rejected"),
    totalEarned: agg?.totalEarned?.[0]?.sum || 0,
  };

  // ── Recent active requests (last 5, fully populated) ─────────────────────
  const recentRequests = await populateBooking(
    Booking.find({ providerId, status: { $in: ["pending", "accepted", "in_progress"] } })
      .sort({ createdAt: -1 })
      .limit(5)
  );

  res.status(200).json({
    success: true,
    stats,
    profile: {
      _id: profile._id,
      averageRating: profile.averageRating,
      totalReviews: profile.totalReviews,
      availability: profile.availability,
      isVerified: profile.isVerified,
      serviceCategories: profile.serviceCategories,
      skills: profile.skills,
      experience: profile.experience,
      serviceArea: profile.serviceArea,
      description: profile.description,
    },
    recentRequests,
  });
};

module.exports = { createBooking, getMyBookings, getBookingById, updateBookingStatus, cancelBooking, getCustomerStats, getProviderStats };
