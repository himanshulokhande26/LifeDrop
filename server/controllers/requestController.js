const EmergencyRequest = require("../models/EmergencyRequest");
const User = require("../models/User");
const { notifyEligibleDonors } = require("../utils/notificationService");
const { normalizePhoneNumber, verifyFirebasePhoneToken } = require("../utils/phoneVerificationService");

// ============================================================================
// @desc    POST /api/requests/create
// @access  Public (add auth middleware when auth is implemented)
// ============================================================================
/**
 * createRequest
 * -------------
 * 1. Validates and saves a new EmergencyRequest document.
 * 2. Runs a $geoNear aggregation pipeline on the User collection to find
 *    all donors with a matching blood group within a 10km radius of the
 *    hospital's coordinates.
 * 3. Triggers the notification service to alert matched donors.
 */
const createRequest = async (req, res) => {
  try {
    const {
      patientName,
      requiredBloodGroup,
      hospitalName,
      urgencyLevel,
      longitude,  // Send as separate numbers from client
      latitude,
      contactPhone,
      phoneVerificationToken,
    } = req.body;

    const normalizedContactPhone = normalizePhoneNumber(contactPhone);

    // --- Basic input validation ---
    if (!patientName || !requiredBloodGroup || !hospitalName || !longitude || !latitude || !normalizedContactPhone || !phoneVerificationToken) {
      return res.status(400).json({
        success: false,
        message: "Please provide patientName, requiredBloodGroup, hospitalName, longitude, latitude, contactPhone and phoneVerificationToken.",
      });
    }

    const phoneVerified = await verifyFirebasePhoneToken(phoneVerificationToken, normalizedContactPhone);
    if (!phoneVerified) {
      return res.status(401).json({
        success: false,
        message: "Firebase phone verification is required before creating a request.",
      });
    }

    // --- 1. Save the new EmergencyRequest ---
    const newRequest = await EmergencyRequest.create({
      patientName,
      requiredBloodGroup,
      hospitalName,
      urgencyLevel: urgencyLevel || "High",
      contactPhone: normalizedContactPhone,
      contactPhoneVerified: true,
      coordinates: {
        type: "Point",
        // MongoDB uses [longitude, latitude] order
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    console.log(`✅ New request created: ${newRequest._id} for blood group ${requiredBloodGroup}`);

    // --- 2. $geoNear aggregation — find matching donors within 10km ---
    const TEN_KM_IN_METERS = 10_000;

    const matchedDonors = await User.aggregate([
      {
        /**
         * $geoNear MUST be the FIRST stage in any aggregation pipeline.
         * `near`       : the GeoJSON point to search near (hospital location)
         * `distanceField` : the field added to each result doc with the distance
         * `maxDistance`: maximum match distance in meters
         * `spherical`  : true for globe-accurate distance (haversine)
         * `query`      : additional filter — blood group must match + donor available
         */
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "distanceToHospital", // metres
          maxDistance: TEN_KM_IN_METERS,
          spherical: true,
          query: {
            bloodGroup: requiredBloodGroup,
            isAvailable: true,
          },
        },
      },
      // Project only the fields needed by the notification service
      {
        $project: {
          name: 1,
          bloodGroup: 1,
          fcmToken: 1,
          hiddenPhoneNumber: 1, // needed for SMS fallback
          distanceToHospital: 1,
        },
      },
    ]);

    console.log(`🔍 Matched ${matchedDonors.length} donor(s) within 10km for blood group ${requiredBloodGroup}:`);
    matchedDonors.forEach((d) =>
      console.log(`   → ${d.name} | ${(d.distanceToHospital / 1000).toFixed(2)} km away`)
    );

    // --- 3. Fire notifications (async, non-blocking for the response) ---
    if (matchedDonors.length > 0) {
      notifyEligibleDonors(matchedDonors, {
        requestId: newRequest._id,
        patientName,
        requiredBloodGroup,
        hospitalName,
        urgencyLevel: newRequest.urgencyLevel,
      }).catch((err) => console.error("Notification dispatch error:", err));
    }

    return res.status(201).json({
      success: true,
      message: "Emergency request created successfully.",
      data: {
        requestId: newRequest._id,
        matchedDonorsCount: matchedDonors.length,
      },
    });
  } catch (error) {
    console.error("createRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating request.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================================
// @desc    PUT /api/requests/accept/:requestId
// @access  Private (donor must be authenticated — add auth middleware later)
// ============================================================================
/**
 * acceptRequest
 * -------------
 * Double-Blind Privacy implementation:
 *   - A donor's identity is NOT shared with the patient upfront.
 *   - The patient's contactPhone is ONLY returned to the donor upon
 *     successfully accepting the request — never before.
 *
 * Steps:
 *   1. Find the request and ensure it is still Pending.
 *   2. Atomically update status → 'Accepted' and set acceptedBy.
 *   3. Return the contactPhone in the response (one-time reveal).
 */
const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // donorId is set by authMiddleware from the verified JWT — never trust the body
    const donorId = req.user.id;

    // --- 1. Find request — include contactPhone via explicit select ---
    const request = await EmergencyRequest.findById(requestId).select("+contactPhone");

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `This request is already ${request.status}. It can no longer be accepted.`,
      });
    }

    // --- 2. Atomically update status and acceptedBy ---
    request.status = "Accepted";
    request.acceptedBy = donorId;
    await request.save();

    console.log(`✅ Request ${requestId} accepted by donor ${donorId}`);

    // --- 3. Double-Blind reveal: return contactPhone only now ---
    return res.status(200).json({
      success: true,
      message: "You have successfully accepted this request. Here is the patient contact.",
      data: {
        requestId: request._id,
        patientName: request.patientName,
        hospitalName: request.hospitalName,
        requiredBloodGroup: request.requiredBloodGroup,
        urgencyLevel: request.urgencyLevel,
        // 🔓 Privacy reveal — only returned after acceptance
        contactPhone: request.contactPhone,
      },
    });
  } catch (error) {
    console.error("acceptRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while accepting request.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { createRequest, acceptRequest };
