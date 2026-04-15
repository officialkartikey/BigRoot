const express = require("express");
const router = express.Router();

const { getProfile } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

// 🔐 Protected route
router.get("/profile", protect, getProfile);

module.exports = router;