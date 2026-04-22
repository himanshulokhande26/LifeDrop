const cron = require("node-cron");
const EmergencyRequest = require("../models/EmergencyRequest");

/**
 * initCronJobs
 * ------------
 * Registers all LifeDrop scheduled tasks. Call this once during server startup
 * (inside index.js after the DB connects).
 *
 * Current Jobs:
 *   - Auto-Expiry: Runs every hour, finds Pending requests older than 24h
 *     and marks them Expired.
 */
const initCronJobs = () => {
  // ---------------------------------------------------------------------------
  // Job: Auto-expire stale blood requests
  // Schedule: "0 * * * *"  → top of every hour (minute=0, every hour)
  // ---------------------------------------------------------------------------
  cron.schedule("0 * * * *", async () => {
    const jobLabel = "[CronJob: AutoExpiry]";
    console.log(`⏰ ${jobLabel} Running at ${new Date().toISOString()}`);

    try {
      // Calculate the cutoff timestamp: now minus 24 hours
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Bulk update: all Pending requests created before the cutoff → Expired
      const result = await EmergencyRequest.updateMany(
        {
          status: "Pending",
          createdAt: { $lt: cutoff }, // older than 24 hours
        },
        {
          $set: { status: "Expired" },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ ${jobLabel} Expired ${result.modifiedCount} stale request(s).`);
      } else {
        console.log(`ℹ️  ${jobLabel} No stale requests found.`);
      }
    } catch (error) {
      console.error(`❌ ${jobLabel} Error during auto-expiry:`, error.message);
    }
  });

  console.log("🕐 Cron jobs initialized: Auto-Expiry scheduled every hour.");
};

module.exports = { initCronJobs };
