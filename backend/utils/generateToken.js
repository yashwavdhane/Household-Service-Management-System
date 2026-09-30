const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT for a given user ID.
 * Reads secret and expiry from environment variables.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
