const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages,
  deleteMessage
} = require("../controllers/messageController");

const { protect } = require("../middlewares/authMiddleware");

// 💬 Send message
router.post("/send/:userId", protect, sendMessage);

// 📜 Get chat history with a user
router.get("/:userId", protect, getMessages);

// ❌ Delete message
router.delete("/:id", protect, deleteMessage);

module.exports = router;