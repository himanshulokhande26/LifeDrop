const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * authMiddleware
 * ---------------
 * Protects routes by verifying the JWT sent in the Authorization header.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 *
 * On success: attaches `req.user = { id }` and calls next().
 * On failure: returns 401 Unauthorized immediately.
 */
const authMiddleware = async (req, res, next) => {
  try {
    // --- 1. Extract token from header ---
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    // --- 2. Verify token ---
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Your session has expired. Please log in again."
          : "Invalid token. Please log in again.";

      return res.status(401).json({ success: false, message });
    }

    // --- 3. Check user still exists in DB ---
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The account associated with this token no longer exists.",
      });
    }

    // --- 4. Attach user to request object ---
    req.user = { id: user._id.toString() };

    next();
  } catch (error) {
    console.error("authMiddleware error:", error);
    return res.status(500).json({ success: false, message: "Authentication error." });
  }
};

module.exports = authMiddleware;
