const express = require("express");
const router = express.Router();
const { createRequest, acceptRequest } = require("../controllers/requestController");
const { getNearbyRequests }            = require("../controllers/donorController");
const authMiddleware                   = require("../middleware/authMiddleware");

// Public — anyone can post an emergency request
router.post("/create", createRequest);

// Private — only authenticated donors
router.get("/nearby",              authMiddleware, getNearbyRequests);
router.put("/accept/:requestId",   authMiddleware, acceptRequest);

module.exports = router;
