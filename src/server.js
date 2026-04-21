
require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const http = require("http");
const { Server } = require("socket.io");

// ✅ connect DB
connectDB();

// ✅ create HTTP server from express app
const server = http.createServer(app);

// ✅ setup socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ✅ socket logic file
require("./socket/socket")(io);

// ✅ test route
app.get("/", (req, res) => {
  res.json({ msg: "Backend is live 🚀" });
});

const PORT = process.env.PORT || 5000;

// ✅ use server.listen (NOT app.listen)
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});