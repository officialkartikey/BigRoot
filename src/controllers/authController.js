const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");


// ADMIN REGISTER (only one per college)
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, collegeName } = req.body;

    // Check if admin already exists for that college
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

    res.status(201).json({
      msg: "Admin registered successfully",
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