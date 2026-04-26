

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { DOMAIN_LIST } = require("../utils/constants");
const Post = require("../models/Post");
const Connection = require("../models/Connection");
// const User = require("../models/User");



exports.getProfile = async (req, res) => {
  try {
    // req.user is coming from authMiddleware
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      msg: "Profile fetched successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // 1️⃣ Validate inputs
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        msg: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        msg: "New passwords do not match",
      });
    }

    // 2️⃣ Get user from token
    const user = await User.findById(req.user._id);

    // 3️⃣ Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Old password is incorrect",
      });
    }

    // 4️⃣ Prevent same password reuse
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({
        msg: "New password cannot be same as old password",
      });
    }

    // 5️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.json({
      msg: "Password updated successfully",
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};



exports.updateProfile = async (req, res) => {
  try {
    const { name, email, domain, about } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // ✅ Common updates
    if (name) user.name = name;
    if (about) user.about = about;

    // ✅ Student specific
    if (user.role === "student") {

      if (email) user.email = email;

      if (domain !== undefined) {
        let normalizedDomain = domain;

        if (!Array.isArray(normalizedDomain)) {
          normalizedDomain = [normalizedDomain];
        }

        normalizedDomain = normalizedDomain
          .map(d => (typeof d === "string" ? d.trim() : ""))
          .filter(d => d.length > 0);

        normalizedDomain = [...new Set(normalizedDomain)];

        if (normalizedDomain.length > 10) {
          return res.status(400).json({ msg: "Max 10 domains allowed" });
        }

        user.domain = normalizedDomain;
      }
    }

    // 📸 Profile photo
    if (req.file) {
      user.profilePhoto = req.file.path; 
      // Cloudinary → req.file.path already contains URL (if configured)
    }

    await user.save();

    // ✅ get updated user without password
    const updatedUser = await User.findById(req.user._id).select("-password");

    console.log("updateProfile API hit");

    // 🔥 THIS WAS MISSING
    return res.status(200).json({
      msg: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: error.message });
  }
};



exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const currentUser = req.user._id;

    let { page = 1, limit = 5 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 👤 user info
    const user = await User.findById(userId).select("-password");

    // 📝 posts with pagination
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ author: userId });

    // 🔗 connection status
    const connection = await Connection.findOne({
      $or: [
        { sender: currentUser, receiver: userId },
        { sender: userId, receiver: currentUser },
      ],
    });

    let connectionStatus = "none";

    if (connection) {
      if (connection.status === "pending") {
        connectionStatus =
          connection.sender.toString() === currentUser.toString()
            ? "pending_sent"
            : "pending_received";
      } else if (connection.status === "accepted") {
        connectionStatus = "connected";
      }
    }

    res.json({
      user,
      posts,
      page,
      totalPosts,
      connectionStatus,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
// const User = require("../models/User");

exports.getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("name profilePhoto role collegeName") // 🔒 safe fields only
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments();

    res.json({
      page,
      totalUsers,
      count: users.length,
      users,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};


