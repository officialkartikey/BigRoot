const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔔 Get notifications
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit)
      .populate("sender", "name profilePhoto")
      .populate("post", "text media");

    // 🔥 Count unread
    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    res.json({
      page,
      count: notifications.length,
      unreadCount,
      notifications,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};