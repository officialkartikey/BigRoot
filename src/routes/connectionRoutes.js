const express = require("express");
const router = express.Router();

const {
  sendRequest,
  respond,
  getPendingRequests,
  getConnections
} = require("../controllers/connectionController");

const { protect } = require("../middlewares/authMiddleware");

// 🔗 Send connection request
router.post("/send/:userId", protect, sendRequest);

// ✅ Accept / ❌ Reject request
router.post("/respond/:connectionId", protect, respond);

// 👥 Get my connections
router.get("/my", protect, getConnections);
router.get("/requests", protect, getPendingRequests);
module.exports = router;