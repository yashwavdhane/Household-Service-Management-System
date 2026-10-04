const User = require("../models/User");
const ProviderProfile = require("../models/ProviderProfile");
const Booking = require("../models/Booking");
const ServiceCategory = require("../models/ServiceCategory");

// ─── Helper: safely parse int pagination params ───────────────────────────────
const parsePage = (q) => {
  const page  = Math.max(1, parseInt(q?.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q?.limit) || 20));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/dashboard
// @desc   Complete platform statistics for the admin overview page
// @access Admin only
// ═══════════════════════════════════════════════════════════════════════════════
const getDashboardStats = async (req, res) => {
  // Run all aggregations in parallel for speed
  const [
    totalUsers,
    totalCustomers,
    totalProviders,
    activeProviders,
    inactiveProviders,
    verifiedProviders,
    bookingAgg,
    totalCategories,
    activeCategories,
    recentBookings,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "provider" }),
    ProviderProfile.countDocuments({ availability: true }),
    ProviderProfile.countDocuments({ availability: false }),
    ProviderProfile.countDocuments({ isVerified: true }),

    // Single $facet aggregation for all booking status counts
    Booking.aggregate([
      {
        $facet: {
          total:       [{ $count: "n" }],
          pending:     [{ $match: { status: "pending" } },     { $count: "n" }],
          accepted:    [{ $match: { status: "accepted" } },    { $count: "n" }],
          in_progress: [{ $match: { status: "in_progress" } }, { $count: "n" }],
          completed:   [{ $match: { status: "completed" } },   { $count: "n" }],
          cancelled:   [{ $match: { status: "cancelled" } },   { $count: "n" }],
          rejected:    [{ $match: { status: "rejected" } },    { $count: "n" }],
          revenue: [
            { $match: { status: "completed", finalPrice: { $ne: null } } },
            { $group: { _id: null, sum: { $sum: "$finalPrice" } } },
          ],
        },
      },
    ]),

    ServiceCategory.countDocuments(),
    ServiceCategory.countDocuments({ isActive: true }),

    // Recent 10 bookings (fully populated)
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("customerId", "name email")
      .populate({
        path: "providerId",
        select: "userId",
        populate: { path: "userId", select: "name" },
      })
      .populate("serviceCategoryId", "name image"),

    // Recent 5 registered users
    User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt isActive"),
  ]);

  const pick = (key) => bookingAgg?.[0]?.[key]?.[0]?.n || 0;

  res.status(200).json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        providers: totalProviders,
        activeProviders,
        inactiveProviders,
        verifiedProviders,
      },
      bookings: {
        total:       pick("total"),
        pending:     pick("pending"),
        accepted:    pick("accepted"),
        in_progress: pick("in_progress"),
        completed:   pick("completed"),
        cancelled:   pick("cancelled"),
        rejected:    pick("rejected"),
        totalRevenue: bookingAgg?.[0]?.revenue?.[0]?.sum || 0,
      },
      categories: {
        total: totalCategories,
        active: activeCategories,
        inactive: totalCategories - activeCategories,
      },
    },
    recentBookings,
    recentUsers,
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/users
// @desc   List all users with search, role filter, status filter, pagination
// @access Admin only
// Query: ?search=&role=&isActive=&page=&limit=
// ═══════════════════════════════════════════════════════════════════════════════
const getUsers = async (req, res) => {
  const { search, role, isActive, page: _p, limit: _l } = req.query;
  const { page, limit, skip } = parsePage(req.query);

  const filter = {};
  if (role && ["customer", "provider", "admin"].includes(role)) filter.role = role;
  if (isActive !== undefined && isActive !== "") filter.isActive = isActive === "true";
  if (search?.trim()) {
    const re = new RegExp(search.trim(), "i");
    filter.$or = [{ name: re }, { email: re }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-password"),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    users,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/admin/users/:id/status
// @desc   Activate or deactivate a user account
// @access Admin only
// Body: { isActive: boolean }
// ═══════════════════════════════════════════════════════════════════════════════
const updateUserStatus = async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") {
    res.status(400);
    throw new Error("isActive must be a boolean");
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot deactivate your own account");
  }

  user.isActive = isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    user: user.toPublicJSON(),
  });
};
// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/admin/users/:id
// @desc   Delete a user (soft delete if they have history, hard delete otherwise)
// @access Admin only
// ═══════════════════════════════════════════════════════════════════════════════
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }

  // Check relationships for historical records
  const [customerBookings, providerBookings] = await Promise.all([
    Booking.countDocuments({ customerId: user._id }),
    user.role === "provider" ? Booking.countDocuments({ providerId: user._id }) : 0
  ]);

  const hasHistory = customerBookings > 0 || providerBookings > 0;

  if (hasHistory) {
    // Soft delete (deactivate)
    user.isActive = false;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "User deactivated successfully (historical records exist).",
      action: "deactivated",
    });
  } else {
    // Hard delete
    // Always clean up associated records, regardless of role, to prevent orphaned data
    
    // 1. Delete all notifications for this user
    const Notification = require("../models/Notification");
    await Notification.deleteMany({ userId: user._id });

    // 2. Delete ProviderProfile if it exists (using deleteMany to handle any duplicates)
    await ProviderProfile.deleteMany({ userId: user._id });

    // 3. Delete ProviderServices if they exist
    const ProviderService = require("../models/ProviderService");
    await ProviderService.deleteMany({ providerId: user._id });

    // 4. Finally, delete the User record
    await User.findByIdAndDelete(user._id);
    
    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      action: "deleted",
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/providers
// @desc   List all provider profiles with search, filter, pagination
// @access Admin only
// Query: ?search=&isVerified=&availability=&page=&limit=
// ═══════════════════════════════════════════════════════════════════════════════
const getProviders = async (req, res) => {
  const { search, isVerified, availability } = req.query;
  const { page, limit, skip } = parsePage(req.query);

  const profileFilter = {};
  if (isVerified !== undefined && isVerified !== "") profileFilter.isVerified = isVerified === "true";
  if (availability !== undefined && availability !== "") profileFilter.availability = availability === "true";

  // We need to search by user name/email — fetch matching user IDs first
  let userIdFilter = [];
  if (search?.trim()) {
    const re = new RegExp(search.trim(), "i");
    const matchingUsers = await User.find({ $or: [{ name: re }, { email: re }], role: "provider" }).select("_id");
    userIdFilter = matchingUsers.map((u) => u._id);
    if (userIdFilter.length === 0) {
      // No users matched search — return empty
      return res.status(200).json({ success: true, providers: [], pagination: { total: 0, page, limit, pages: 0 } });
    }
    profileFilter.userId = { $in: userIdFilter };
  }

  const [profiles, total] = await Promise.all([
    ProviderProfile.find(profileFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email phone profileImage isActive createdAt")
      .populate("serviceCategories", "name image"),
    ProviderProfile.countDocuments(profileFilter),
  ]);

  // Attach booking counts per provider using aggregation
  const providerIds = profiles.map((p) => p._id);
  const bookingCounts = await Booking.aggregate([
    { $match: { providerId: { $in: providerIds } } },
    { $group: { _id: "$providerId", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
  ]);
  const countMap = {};
  bookingCounts.forEach((b) => { countMap[b._id.toString()] = b; });

  const providersWithCounts = profiles.map((p) => ({
    ...p.toObject(),
    bookingStats: countMap[p._id.toString()] || { total: 0, completed: 0 },
  }));

  res.status(200).json({
    success: true,
    providers: providersWithCounts,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/admin/providers/:id/verify
// @desc   Verify or un-verify a provider profile
// @access Admin only
// Body: { isVerified: boolean }
// ═══════════════════════════════════════════════════════════════════════════════
const updateProviderVerification = async (req, res) => {
  const { isVerified } = req.body;
  if (typeof isVerified !== "boolean") {
    res.status(400);
    throw new Error("isVerified must be a boolean");
  }

  const profile = await ProviderProfile.findById(req.params.id)
    .populate("userId", "name email");
  if (!profile) {
    res.status(404);
    throw new Error("Provider profile not found");
  }

  profile.isVerified = isVerified;
  await profile.save();

  res.status(200).json({
    success: true,
    message: `Provider ${isVerified ? "verified" : "unverified"} successfully`,
    provider: profile,
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/bookings
// @desc   List all bookings with status/category filters, pagination
// @access Admin only
// Query: ?status=&categoryId=&page=&limit=
// ═══════════════════════════════════════════════════════════════════════════════
const getAllBookings = async (req, res) => {
  const { status, categoryId } = req.query;
  const { page, limit, skip } = parsePage(req.query);

  const filter = {};
  const validStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled", "rejected"];
  if (status && validStatuses.includes(status)) filter.status = status;
  if (categoryId) filter.serviceCategoryId = categoryId;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customerId", "name email phone")
      .populate({
        path: "providerId",
        select: "userId averageRating",
        populate: { path: "userId", select: "name email" },
      })
      .populate("serviceCategoryId", "name image"),
    Booking.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    bookings,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/analytics
// @desc   Aggregated analytics for charts: bookings over time, category breakdown,
//         user growth, revenue trend
// @access Admin only
// ═══════════════════════════════════════════════════════════════════════════════
const getAnalytics = async (req, res) => {
  const now = new Date();
  // Last 6 months
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    bookingsByMonth,
    bookingsByStatus,
    bookingsByCategory,
    usersByMonth,
    revenueByMonth,
    totalUsers,
    totalCustomers,
    totalProviders,
    activeProviders,
    verifiedProviders,
    inactiveUsers,
  ] = await Promise.all([
    // Bookings created per month (last 6 months)
    Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Bookings by status (all time)
    Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    // Top 8 service categories by booking count
    Booking.aggregate([
      {
        $group: {
          _id: "$serviceCategoryId",
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "servicecategories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$category.name", "Unknown"] },
          image: { $ifNull: ["$category.image", "🔧"] },
          count: 1,
          completed: 1,
        },
      },
    ]),

    // New users per month (last 6 months)
    User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            role: "$role",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Revenue per month (last 6 months, completed bookings with finalPrice)
    Booking.aggregate([
      { $match: { status: "completed", finalPrice: { $ne: null }, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$finalPrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    User.countDocuments(),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "provider" }),
    ProviderProfile.countDocuments({ availability: true }),
    ProviderProfile.countDocuments({ isVerified: true }),
    User.countDocuments({ isActive: false }),
  ]);

  // ── Build a complete 6-month timeline ──────────────────────────────────────
  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_LABELS[d.getMonth()] });
  }

  const bookingTimeline = months.map((m) => {
    const found = bookingsByMonth.find((b) => b._id.year === m.year && b._id.month === m.month);
    return { month: m.label, bookings: found?.count || 0 };
  });

  const revenueTimeline = months.map((m) => {
    const found = revenueByMonth.find((b) => b._id.year === m.year && b._id.month === m.month);
    return { month: m.label, revenue: found?.revenue || 0, completedJobs: found?.count || 0 };
  });

  // User growth timeline (customers vs providers)
  const userTimeline = months.map((m) => {
    const customers = usersByMonth.find((u) => u._id.year === m.year && u._id.month === m.month && u._id.role === "customer");
    const providers = usersByMonth.find((u) => u._id.year === m.year && u._id.month === m.month && u._id.role === "provider");
    return { month: m.label, customers: customers?.count || 0, providers: providers?.count || 0 };
  });

  // Status distribution (for pie chart)
  const statusLabels = { pending: "Pending", accepted: "Accepted", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled", rejected: "Rejected" };
  const statusColors = { pending: "#f59e0b", accepted: "#3b82f6", in_progress: "#8b5cf6", completed: "#10b981", cancelled: "#94a3b8", rejected: "#ef4444" };
  const statusDistribution = bookingsByStatus.map((b) => ({
    name: statusLabels[b._id] || b._id,
    value: b.count,
    color: statusColors[b._id] || "#64748b",
  }));

  const bookingTotals = {
    total: bookingsByStatus.reduce((acc, b) => acc + b.count, 0),
    pending: bookingsByStatus.find(b => b._id === "pending")?.count || 0,
    active: (bookingsByStatus.find(b => b._id === "accepted")?.count || 0) + (bookingsByStatus.find(b => b._id === "in_progress")?.count || 0),
    completed: bookingsByStatus.find(b => b._id === "completed")?.count || 0,
    cancelled: (bookingsByStatus.find(b => b._id === "cancelled")?.count || 0) + (bookingsByStatus.find(b => b._id === "rejected")?.count || 0),
  };

  const allTimeRevenue = revenueByMonth.reduce((acc, r) => acc + r.revenue, 0);

  res.status(200).json({
    success: true,
    totals: {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        providers: totalProviders,
        activeProviders,
        verifiedProviders,
        inactive: inactiveUsers,
      },
      bookings: bookingTotals,
      financial: {
        totalRevenue: allTimeRevenue,
      }
    },
    bookingTimeline,
    revenueTimeline,
    userTimeline,
    statusDistribution,
    categoryBreakdown: bookingsByCategory,
  });
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  deleteUser,
  getProviders,
  updateProviderVerification,
  getAllBookings,
  getAnalytics,
};
