const mongoose = require("mongoose");

/**
 * User Schema
 * -----------
 * Stores registered blood donor / patient accounts.
 * The `location` field uses GeoJSON Point format required by MongoDB's
 * $geoNear operator. A 2dsphere index is applied for spatial queries.
 *
 * PRIVACY NOTE: `hiddenPhoneNumber` is NEVER returned to the client
 * unless a donor explicitly accepts a request (Double-Blind model).
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      uppercase: true,
    },

    // Stored securely — hashed with bcrypt before saving (see auth controller)
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Never returned in queries by default
    },

    // Real phone number — hidden from public. Only revealed after acceptance.
    hiddenPhoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      select: false, // Never returned in queries by default
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerifiedAt: {
      type: Date,
      default: null,
    },

    // Firebase Cloud Messaging token for Web Push Notifications
    fcmToken: {
      type: String,
      default: null,
    },

    /**
     * GeoJSON Point — stores the donor's last known location.
     * Format: { type: "Point", coordinates: [longitude, latitude] }
     * NOTE: MongoDB stores [lng, lat] (not [lat, lng]) — important!
     */
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    isAvailable: {
      type: Boolean,
      default: true, // Donor is available by default
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ---------------------------------------------------------------------------
// 2dsphere index — mandatory for $geoNear / $near / $geoWithin queries
// ---------------------------------------------------------------------------
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
