const express = require("express");
const router = express.Router();
const { sendMessage, getBookingMessages } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/:bookingId", sendMessage);
router.get("/:bookingId", getBookingMessages);

module.exports = router;
