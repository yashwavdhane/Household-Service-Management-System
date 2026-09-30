const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * Exits the process on failure so the server doesn't silently run without DB.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
