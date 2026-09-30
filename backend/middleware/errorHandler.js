// ─── 404 Not Found Handler ────────────────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ─── Central Error Handler ────────────────────────────────────────────────────
// Must be 4-parameter to be recognized as an error handler by Express
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Use the status already set on the response, or fall back to 500
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  // Handle Mongoose CastError (bad ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Resource not found — invalid ID format",
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  // Handle Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for field: ${field}`,
    });
  }

  // Generic error response
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Stack trace only in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
