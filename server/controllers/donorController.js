const EmergencyRequest = require("../models/EmergencyRequest");
const User = require("../models/User");

// ============================================================================
// @route   GET /api/requests/nearby
// @desc    Fetch Pending blood requests near the logged-in donor's location
// @access  Private (requires JWT)
// ============================================================================
/**
 * getNearbyRequests
 * -----------------
 * Uses $geoNear to find Pending EmergencyRequests within a given radius
 * (default 10km) that match the donor's own blood group.
 *
 * Query params:
 *   radius  (optional) : search radius in km — default 10
 *   all     (optional) : if "true", skip blood group filter (show all types)
 */
const getNearbyRequests = async (req, res) => {
  try {
    const donorId  = req.user.id;
    const radiusKm = parseFloat(req.query.radius) || 10;
    const showAll  = req.query.all === "true";

    // Fetch the donor's current location and blood group from DB
    const donor = await User.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor profile not found." });
    }

    if (!donor.location?.coordinates?.length) {
      return res.status(400).json({
        success: false,
        message: "Your location is not set. Please update your profile.",
      });
    }

    const [donorLng, donorLat] = donor.location.coordinates;

    // Build the match filter
    const matchFilter = { status: "Pending" };
    if (!showAll) {
      matchFilter.requiredBloodGroup = donor.bloodGroup;
    }

    // $geoNear aggregation on EmergencyRequest.coordinates
    const requests = await EmergencyRequest.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [donorLng, donorLat],
          },
          distanceField: "distanceFromDonor", // metres
          maxDistance:   radiusKm * 1000,
          spherical:     true,
          query:         matchFilter,
        },
      },
      // Sort: Critical first, then by distance
      {
        $addFields: {
          urgencyOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$urgencyLevel", "Critical"] }, then: 1 },
                { case: { $eq: ["$urgencyLevel", "High"]     }, then: 2 },
                { case: { $eq: ["$urgencyLevel", "Medium"]   }, then: 3 },
                { case: { $eq: ["$urgencyLevel", "Low"]      }, then: 4 },
              ],
              default: 5,
            },
          },
        },
      },
      { $sort: { urgencyOrder: 1, distanceFromDonor: 1 } },
      // Shape the output — never include contactPhone here
      {
        $project: {
          patientName:        1,
          requiredBloodGroup: 1,
          hospitalName:       1,
          urgencyLevel:       1,
          status:             1,
          coordinates:        1,
          createdAt:          1,
          distanceFromDonor:  1, // metres — client formats to km
        },
      },
      { $limit: 50 }, // Safety cap
    ]);

    return res.status(200).json({
      success: true,
      count: requests.length,
      donorBloodGroup: donor.bloodGroup,
      radiusKm,
      data: requests,
    });
  } catch (error) {
    console.error("getNearbyRequests error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching nearby requests.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { getNearbyRequests };
