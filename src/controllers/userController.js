const User = require("../models/User");

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