const Message = require("../models/Message");
const Notification = require("../models/Notification");

// 🔁 Use Map instead of object (better & safer)
const users = new Map(); // userId → socketId

module.exports = (io) => {

  io.on("connection", (socket) => {

    console.log("🔌 User connected:", socket.id);

    // 🔗 Register user
    socket.on("join", (userId) => {
      users.set(userId, socket.id);
      console.log("✅ User joined:", userId);
    });

    // 💬 Send message
    socket.on("sendMessage", async ({ sender, receiver, text }) => {
      try {
        const msg = await Message.create({ sender, receiver, text });

        // send message
        if (users.has(receiver)) {
          io.to(users.get(receiver)).emit("newMessage", msg);

          // 🔔 notification
          io.to(users.get(receiver)).emit("notification", {
            type: "message",
            message: "New message received",
            sender
          });
        }

      } catch (err) {
        console.error("Message error:", err);
      }
    });

    // 🔥 NEW: Connection Request Notification
    socket.on("sendConnectionRequest", async ({ senderId, receiverId }) => {
      try {

        // 🗄️ Save in DB
        const notification = await Notification.create({
          user: receiverId,
          type: "connection_request",
          message: "You have a new connection request",
          sender: senderId
        });

        // 📡 Real-time emit
        if (users.has(receiverId)) {
          io.to(users.get(receiverId)).emit("notification", {
            _id: notification._id,
            type: "connection_request",
            message: "You have a new connection request",
            sender: senderId
          });
        }

      } catch (err) {
        console.error("Connection request error:", err);
      }
    });

    // 🔔 Post notification
    socket.on("newPost", ({ connections, user }) => {
      connections.forEach((id) => {
        if (users.has(id)) {
          io.to(users.get(id)).emit("notification", {
            type: "post",
            message: `${user} posted something`
          });
        }
      });
    });

    // ❌ Disconnect
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);

      for (let [key, value] of users.entries()) {
        if (value === socket.id) {
          users.delete(key);
          break;
        }
      }
    });

  });
};