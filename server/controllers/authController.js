const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ---------------------------------------------------------------------------
// Helper: Generate a signed JWT
// ---------------------------------------------------------------------------
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ============================================================================
// @route   POST /api/auth/register
// @desc    Register a new donor/user account
// @access  Public
// ============================================================================
/**
 * register
 * --------
 * 1. Checks if email/phone already exists.
 * 2. Hashes the password with bcrypt (salt rounds: 12).
 * 3. Saves the new User document.
 * 4. Returns a signed JWT so the user is immediately logged in.
 *
 * NOTE: password and hiddenPhoneNumber have `select: false` on the schema,
 *       so we must use `.select("+password")` only when we explicitly need them.
 */
const register = async (req, res) => {
  try {
    const {
      name,
      bloodGroup,
      phoneNumber,  // Stored as hiddenPhoneNumber
      password,
      longitude,
      latitude,
    } = req.body;

    // --- Input validation ---
    if (!name || !bloodGroup || !phoneNumber || !password || !longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, bloodGroup, phoneNumber, password, longitude and latitude.",
      });
    }

    // --- Check for duplicate phone number ---
    // We temporarily unset select:false for this lookup only
    const existing = await User.findOne({ hiddenPhoneNumber: phoneNumber }).select("+hiddenPhoneNumber");
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this phone number already exists.",
      });
    }

    // --- Hash password ---
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Create user ---
    const user = await User.create({
      name,
      bloodGroup,
      hiddenPhoneNumber: phoneNumber,
      password: hashedPassword,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    // --- Generate JWT ---
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Welcome to LifeDrop!",
      token,
      user: {
        id:         user._id,
        name:       user.name,
        bloodGroup: user.bloodGroup,
        isAvailable: user.isAvailable,
      },
    });
  } catch (error) {
    console.error("register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================================
// @route   POST /api/auth/login
// @desc    Log in with phone number + password
// @access  Public
// ============================================================================
/**
 * login
 * -----
 * 1. Finds the user by phone number (select: false fields must be explicitly selected).
 * 2. Compares provided password with stored bcrypt hash.
 * 3. Returns a signed JWT and safe user data on success.
 */
const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required.",
      });
    }

    // Explicitly select hidden fields needed for auth
    const user = await User
      .findOne({ hiddenPhoneNumber: phoneNumber })
      .select("+password +hiddenPhoneNumber");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. No account found with this phone number.",
      });
    }

    // --- Compare password ---
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Incorrect password.",
      });
    }

    // --- Generate token ---
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id:          user._id,
        name:        user.name,
        bloodGroup:  user.bloodGroup,
        isAvailable: user.isAvailable,
        fcmToken:    user.fcmToken,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================================
// @route   GET /api/auth/me
// @desc    Get the currently logged-in user's profile
// @access  Private (requires valid JWT via authMiddleware)
// ============================================================================
const getMe = async (req, res) => {
  try {
    // req.user is attached by authMiddleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      user: {
        id:          user._id,
        name:        user.name,
        bloodGroup:  user.bloodGroup,
        isAvailable: user.isAvailable,
        fcmToken:    user.fcmToken,
        location:    user.location,
        createdAt:   user.createdAt,
      },
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ============================================================================
// @route   PATCH /api/auth/availability
// @desc    Toggle donor availability (on/off)
// @access  Private
// ============================================================================
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be a boolean (true or false).",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isAvailable },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `You are now ${isAvailable ? "available" : "unavailable"} for donation.`,
      isAvailable: user.isAvailable,
    });
  } catch (error) {
    console.error("updateAvailability error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { register, login, getMe, updateAvailability };
