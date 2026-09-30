const Notification = require("../models/Notification");

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/notifications
// @desc   Get logged-in user's notifications (paginated)
// @access Protected
// ═══════════════════════════════════════════════════════════════════════════════
const getNotifications = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId: req.user._id }),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/notifications/:id/read
// @desc   Mark a notification as read
// @access Protected
// ═══════════════════════════════════════════════════════════════════════════════
const markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  res.status(200).json({
    success: true,
    notification,
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/notifications/read-all
// @desc   Mark all user's notifications as read
// @access Protected
// ═══════════════════════════════════════════════════════════════════════════════
const markAllAsRead = async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
