const express = require("express");
const router = express.Router();
const { createRequest, acceptRequest } = require("../controllers/requestController");

// POST /api/requests/create — create a new blood request + find nearby donors
router.post("/create", createRequest);

// PUT /api/requests/accept/:requestId — donor accepts a request (Double-Blind reveal)
router.put("/accept/:requestId", acceptRequest);

module.exports = router;
