const Connection = require("../models/Connection");


// Send request
exports.sendRequest = async (req, res) => {
  const sender = req.user._id;
  const receiver = req.params.userId;

  const exists = await Connection.findOne({
    $or: [
      { sender, receiver },
      { sender: receiver, receiver: sender }
    ]
  });

  if (exists) return res.status(400).json({ msg: "Already exists" });

  const request = await Connection.create({ sender, receiver });

  res.json(request);
};

// Accept / Reject
exports.respond = async (req, res) => {
  const { connectionId } = req.params;
  const { action } = req.body;

  const conn = await Connection.findById(connectionId);

  if (conn.receiver.toString() !== req.user._id.toString()) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  conn.status = action;
  await conn.save();

  res.json(conn);
};
exports.getConnections = async (req, res) => {
  try {
    const userId = req.user._id;

    const connections = await Connection.find({
      $or: [
        { sender: userId, status: "accepted" },
        { receiver: userId, status: "accepted" }
      ]
    })
      .populate("sender", "name profilePhoto")
      .populate("receiver", "name profilePhoto");

    res.json(connections);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await Connection.find({
      receiver: userId,
      status: "pending",
    })
      .populate("sender", "name profilePhoto role")
      .sort({ createdAt: -1 });

    res.json({
      count: requests.length,
      requests,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};