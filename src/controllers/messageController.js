const Message = require("../models/Message");
const Connection = require("../models/Connection");

// Send message
exports.sendMessage = async (req, res) => {
  const sender = req.user._id;
  const receiver = req.params.userId;
  const { text } = req.body;

  const isConnected = await Connection.findOne({
    $or: [
      { sender, receiver },
      { sender: receiver, receiver: sender }
    ],
    status: "accepted"
  });

  if (!isConnected) {
    return res.status(403).json({ msg: "Not connected" });
  }

  const msg = await Message.create({ sender, receiver, text });

  res.json(msg);
};

// Get chat history
exports.getMessages = async (req, res) => {
  const userId = req.user._id;
  const other = req.params.userId;

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: other },
      { sender: other, receiver: userId }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
};

// Delete message
exports.deleteMessage = async (req, res) => {
  const msg = await Message.findById(req.params.id);

  if (msg.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  msg.isDeleted = true;
  msg.text = "This message was deleted";

  await msg.save();

  res.json({ msg: "Deleted" });
};