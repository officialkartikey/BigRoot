const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { updateProfile } = require("../controllers/userController");

const {  getProfile} = require("../controllers/userController");
const {  getUserProfile} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const { changePassword } = require("../controllers/userController");

router.put("/change-password", protect, changePassword);

// 🔐 Protected route
router.get("/profile", protect, getProfile);
router.put(
  "/update-profile",
  protect,
  upload.single("profilePhoto"), // 🔥 important
  updateProfile
);
router.get("/profile/:userId", protect, getUserProfile);

module.exports = router;