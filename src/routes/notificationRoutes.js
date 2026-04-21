const express = require("express");
const router = express.Router();

const {
  getNotifications
} = require("../controllers/notificationController");

const { protect } = require("../middlewares/authMiddleware");

// 🔔 Get all notifications for logged-in user
router.get("/", protect, getNotifications);

module.exports = router;