const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const otpStore = require("../utils/otpStore");
const { sendOTP } = require("../services/emailService");
const crypto = require("crypto");



exports.resendAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const existing = otpStore.get(email);

    // ⏱️ Cooldown: 30 seconds
    if (existing && Date.now() - existing.lastSentAt < 30000) {
      return res.status(429).json({
        msg: "Please wait before requesting OTP again",
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
      lastSentAt: Date.now(),
    });

    await sendOTP(email, otp);

    res.json({ msg: "OTP resent successfully" });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.sendAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (5 min)
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await sendOTP(email, otp);

    res.json({ msg: "OTP sent to email" });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};



exports.verifyAdminOTPAndRegister = async (req, res) => {
  try {
    const { name, email, password, collegeName, otp } = req.body;

    const stored = otpStore.get(email);

    if (!stored) {
      return res.status(400).json({ msg: "OTP not found" });
    }

    if (stored.expiresAt < Date.now()) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    // Check admin exists
    const adminExists = await User.findOne({
      role: "admin",
      collegeName,
    });

    if (adminExists) {
      return res.status(400).json({
        msg: "Admin already exists for this college",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      collegeName,
    });

    otpStore.delete(email); // cleanup

    res.status(201).json({
      msg: "Admin registered successfully",
      token: generateToken(admin._id),
      user: admin,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password, collegeName } = req.body;

    // Find admin by email + college
    const admin = await User.findOne({
      email,
      role: "admin",
      collegeName,
    });

    if (!admin) {
      return res.status(400).json({
        msg: "Admin not found",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Invalid credentials",
      });
    }

    res.json({
      msg: "Login successful",
      token: generateToken(admin._id),
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        collegeName: admin.collegeName,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { identifier, password, role, collegeName } = req.body;

    let user;

    // =======================
    // 🎓 STUDENT LOGIN
    // =======================
    if (role === "student") {
      user = await User.findOne({
        collegeId: identifier,
        role: "student",
        collegeName,
      });
    }

    // =======================
    // 👨‍🏫 FACULTY LOGIN
    // =======================
    else if (role === "faculty") {
      user = await User.findOne({
        email: identifier,
        role: "faculty",
        collegeName,
      });
    }

    // =======================
    // ❌ INVALID ROLE
    // =======================
    else {
      return res.status(400).json({ msg: "Invalid role selected" });
    }

    // =======================
    // ❌ USER NOT FOUND
    // =======================
    if (!user) {
      return res.status(400).json({
        msg: "User not found",
      });
    }

    // =======================
    // 🔐 PASSWORD CHECK
    // =======================
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Invalid credentials",
      });
    }

    // =======================
    // ✅ SUCCESS
    // =======================
    res.json({
      msg: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        collegeName: user.collegeName,
        email: user.email || null,
        collegeId: user.collegeId || null,
      },
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { identifier, role, collegeName } = req.body;

    let user;

    if (role === "student") {
      user = await User.findOne({
        collegeId: identifier,
        role: "student",
        collegeName,
      });
    } else {
      user = await User.findOne({
        email: identifier,
        role,
        collegeName,
      });
    }

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 🔐 Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min

    await user.save();

    // 🔗 Reset link
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    // 📧 Send mail
    await sendOTP(
      user.email,
      `Reset your password using this link: ${resetUrl}`
    );

    res.json({
      msg: "Password reset link sent to email",
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        msg: "Passwords do not match",
      });
    }

    // Hash token from URL
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid or expired token",
      });
    }

    // Set new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      msg: "Password reset successful",
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};