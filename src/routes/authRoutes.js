const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
   loginUser,
} = require("../controllers/authController");

// Admin routes
router.post("/admin-register", registerAdmin);
router.post("/admin-login", loginAdmin);
router.post("/login", loginUser);

module.exports = router;