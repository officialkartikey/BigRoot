

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

      // 🔥 DOMAIN VALIDATION (your code integrated)
      if (domain) {

        // ensure array
        if (!Array.isArray(domain)) {
          return res.status(400).json({ msg: "Domain must be an array" });
        }

        // validate values
        const invalid = domain.filter(d => !DOMAIN_LIST.includes(d));

        if (invalid.length > 0) {
          return res.status(400).json({
            msg: "Invalid domain selected",
            invalid
          });
        }

        user.domain = domain;
      }
    }

    // 📸 Profile photo (Cloudinary URL preferred)
    if (req.file) {
      user.profilePhoto = req.file.path; 
      // 👉 If using Cloudinary uploader, use:
      // user.profilePhoto = result.secure_url;
    }

    await user.save();

   await User.findById(req.user._id).select("-password");

  } catch (error) {
    res.status(500).json({ msg: error.message });
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


