const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the URI stored in the MONGODB_URI env variable.
 * Exits the process on failure so the server doesn't boot with no database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;
