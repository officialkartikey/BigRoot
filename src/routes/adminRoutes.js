const express = require("express");
const router = express.Router();

const { createUser } = require("../controllers/adminController");
const { protect } = require("../middlewares/authMiddleware");

// Only admin can access
router.post("/create-user", protect, createUser);

module.exports = router;