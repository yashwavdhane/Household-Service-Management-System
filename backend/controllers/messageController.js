const Message = require("../models/Message");
const Booking = require("../models/Booking");

// ─── @route  POST /api/messages/:bookingId ──────────────────────────────────
// @desc   Send a message on a specific booking (customer or provider)
// @access Protected
const sendMessage = async (req, res) => {
  const { content } = req.body;
  const { bookingId } = req.params;

  if (!content) {
    res.status(400);
    throw new Error("Message content is required");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Verify the user is part of the booking or an admin
  const isCustomer = booking.customerId.toString() === req.user._id.toString();
  // booking.providerId is ProviderProfile _id. Let's populate to check userId, or assume frontend only lets valid users call.
  // Actually, we can check ProviderProfile.
  const ProviderProfile = require("../models/ProviderProfile");
  const provider = await ProviderProfile.findById(booking.providerId);
  const isProvider = provider && provider.userId.toString() === req.user._id.toString();

  if (!isCustomer && !isProvider && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You are not authorized to send messages on this booking");
  }

  const message = await Message.create({
    bookingId,
    senderId: req.user._id,
    content: content.trim()
  });

  await message.populate("senderId", "name role");

  res.status(201).json({ success: true, message });
};

// ─── @route  GET /api/messages/:bookingId ───────────────────────────────────
// @desc   Get all messages for a specific booking
// @access Protected
const getBookingMessages = async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  const isCustomer = booking.customerId.toString() === req.user._id.toString();
  const ProviderProfile = require("../models/ProviderProfile");
  const provider = await ProviderProfile.findById(booking.providerId);
  const isProvider = provider && provider.userId.toString() === req.user._id.toString();

  if (!isCustomer && !isProvider && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You are not authorized to view messages on this booking");
  }

  const messages = await Message.find({ bookingId })
    .sort({ createdAt: 1 })
    .populate("senderId", "name role");

  res.status(200).json({ success: true, messages });
};

// ─── @route  GET /api/admin/communications ──────────────────────────────────
// @desc   Get all messages platform-wide for Admin review
// @access Admin only
const getAdminCommunications = async (req, res) => {
  const { search } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  // For a basic implementation, we just return the latest messages globally
  // and populate the booking and sender details.
  
  const [messages, total] = await Promise.all([
    Message.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "name role email")
      .populate({
        path: "bookingId",
        select: "serviceCategoryId status",
        populate: { path: "serviceCategoryId", select: "name" }
      }),
    Message.countDocuments()
  ]);

  res.status(200).json({
    success: true,
    messages,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) }
  });
};

module.exports = {
  sendMessage,
  getBookingMessages,
  getAdminCommunications
};
