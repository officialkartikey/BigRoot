const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.createUser = async (req, res) => {
  try {
    const { role, collegeName } = req.body;

    // 🔒 Only admin allowed
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can add users" });
    }

    // =======================
    // 🎓 STUDENT CREATION
    // =======================
    if (role === "student") {
      const {
        name,
        branch,
        section,
        year,
        collegeId,
        universityRollNo,
        password,
      } = req.body;

      // Check duplicate
      const exists = await User.findOne({ collegeId });
      if (exists) {
        return res.status(400).json({ msg: "Student already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const student = await User.create({
        name,
        branch,
        section,
        year,
        collegeId,
        universityRollNo,
        password: hashedPassword,
        role: "student",
        collegeName,
        createdBy: req.user._id,
      });

      return res.status(201).json({
        msg: "Student created successfully",
        user: student,
      });
    }

    // =======================
    // 👨‍🏫 FACULTY CREATION
    // =======================
    if (role === "faculty") {
      const {
        name,
        email,
        password,
        designation,
        department,
        qualification,
      } = req.body;

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ msg: "Faculty already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const faculty = await User.create({
        name,
        email,
        password: hashedPassword,
        designation,
        department,
        qualification,
        role: "faculty",
        collegeName,
        createdBy: req.user._id,
      });

      return res.status(201).json({
        msg: "Faculty created successfully",
        user: faculty,
      });
    }

    // =======================
    // ❌ INVALID ROLE
    // =======================
    return res.status(400).json({ msg: "Invalid role" });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};