const mongoose = require("mongoose");

/**
 * EmergencyRequest Schema
 * -----------------------
 * Represents an active blood donation request created by or on behalf of a patient.
 * Uses GeoJSON Point for hospital coordinates to enable $geoNear donor matching.
 *
 * LIFECYCLE:
 *   Pending → (donor accepts) → Accepted
 *   Pending → (24h cron job) → Expired
 */
const emergencyRequestSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },

    requiredBloodGroup: {
      type: String,
      required: [true, "Required blood group is required"],
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      uppercase: true,
    },

    hospitalName: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
    },

    urgencyLevel: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "High",
    },

    /**
     * GeoJSON Point — the hospital's location used to find nearby donors.
     * Format: { type: "Point", coordinates: [longitude, latitude] }
     */
    coordinates: {
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

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Expired"],
      default: "Pending",
    },

    /**
     * Reference to the User who accepted this request.
     * Only populated after status transitions to 'Accepted'.
     */
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /**
     * The requesting user / contact phone — returned ONLY when a donor
     * accepts via the acceptRequest endpoint (Double-Blind Privacy).
     * select: false ensures it never leaks through general queries.
     */
    contactPhone: {
      type: String,
      select: false,
    },

    contactPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // Created by which registered user (optional for guest requests)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true, // createdAt is used by the cron job to detect 24h expiry
  }
);

// ---------------------------------------------------------------------------
// 2dsphere index — required for $geoNear aggregation on coordinates field
// ---------------------------------------------------------------------------
emergencyRequestSchema.index({ coordinates: "2dsphere" });

module.exports = mongoose.model("EmergencyRequest", emergencyRequestSchema);
