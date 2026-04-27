const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateAvailability,
  updateFcmToken,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login",    login);

// Protected routes (require valid JWT)
router.get("/me",                   authMiddleware, getMe);
router.patch("/availability",       authMiddleware, updateAvailability);
router.patch("/fcm-token",          authMiddleware, updateFcmToken);

module.exports = router;
