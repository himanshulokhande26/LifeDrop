/**
 * LifeDrop Server — Entry Point
 * ==============================
 * Bootstraps the Express application, connects to MongoDB,
 * mounts all API routes, and starts background cron jobs.
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env before any other imports
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");
const errorHandler = require("./middleware/errorHandler");
const { initCronJobs } = require("./utils/cronJobs");

// ---------------------------------------------------------------------------
// Firebase Admin SDK Initialization
// ---------------------------------------------------------------------------
// Requires a Google Service Account JSON file downloaded from:
//   Firebase Console → Project Settings → Service Accounts → Generate new private key
// Store this file at: server/config/serviceAccountKey.json  (never commit it!)
const admin = require("firebase-admin");

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.join(__dirname, "config", "serviceAccountKey.json");

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("🔥 Firebase Admin SDK initialized.");
} catch (err) {
  console.warn(
    "⚠️  Firebase Admin SDK NOT initialized (missing serviceAccountKey.json).",
    "FCM push notifications will not work. SMS fallback will be used."
  );
}

// ---------------------------------------------------------------------------
// Express App Setup
// ---------------------------------------------------------------------------
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use("/api/auth",     authRoutes);     // Public: /register, /login | Private: /me, /availability
app.use("/api/requests", requestRoutes);  // Mixed: create (public), accept (private via controller)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Global Error Handler — must be LAST middleware
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Connect to MongoDB first
  await connectDB();

  // 2. Initialize background cron jobs after DB is ready
  initCronJobs();

  // 3. Start listening
  app.listen(PORT, () => {
    console.log(`🚀 LifeDrop server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    console.log(`   → Health: http://localhost:${PORT}/api/health`);
  });
};

startServer();
