const express = require("express");
const router = express.Router();

const {
   sendAdminOTP,
  verifyAdminOTPAndRegister,
  resendAdminOTP,
  loginAdmin,
   loginUser,
   forgotPassword,
   resetPassword,
} = require("../controllers/authController");

// 🔥 NEW FLOW
router.post("/send-otp", sendAdminOTP);
router.post("/resend-otp", resendAdminOTP);
router.post("/verify-otp-register", verifyAdminOTPAndRegister);
router.post("/admin-login", loginAdmin);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);

// token in URL
router.post("/reset-password/:token", resetPassword);

module.exports = router;