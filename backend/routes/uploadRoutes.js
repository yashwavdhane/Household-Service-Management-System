const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { protect } = require("../middleware/auth");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Configure Multer ─────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Relative to server.js working directory
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isValidMime = allowedTypes.test(file.mimetype);

  if (isValidExt && isValidMime) {
    return cb(null, true);
  }
  cb(new Error("Only image files (jpeg, jpg, png, webp, gif) are allowed"), false);
};

// Max 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/upload/image
// @desc   Uploads a single image and returns the local URL path
// @access Protected
// ═══════════════════════════════════════════════════════════════════════════════
router.post("/image", protect, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file provided" });
  }

  // Construct URL path that can be saved in DB
  const imagePath = `/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    url: imagePath,
  });
});

// Error handling for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "File size exceeds 5MB limit" });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

module.exports = router;
