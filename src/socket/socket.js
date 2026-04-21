const Message = require("../models/Message");
const Notification = require("../models/Notification");

let users = {}; // userId → socketId

module.exports = (io) => {

  io.on("connection", (socket) => {

    // 🔗 Register user
    socket.on("join", (userId) => {
      users[userId] = socket.id;
    });

    // 💬 Send message real-time
    socket.on("sendMessage", async ({ sender, receiver, text }) => {

      const msg = await Message.create({ sender, receiver, text });

      // send to receiver
      if (users[receiver]) {
        io.to(users[receiver]).emit("newMessage", msg);
      }

      // 🔔 notification
      if (users[receiver]) {
        io.to(users[receiver]).emit("notification", {
          message: "New message received"
        });
      }
    });

    // 🔔 Post notification
    socket.on("newPost", ({ connections, user }) => {
      connections.forEach((id) => {
        if (users[id]) {
          io.to(users[id]).emit("notification", {
            message: `${user} posted something`
          });
        }
      });
    });

    socket.on("disconnect", () => {
      for (let key in users) {
        if (users[key] === socket.id) delete users[key];
      }
    });

  });
};