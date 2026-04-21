const express = require("express");
const router = express.Router();

router.use("/auth", require("./authRoutes"));
router.use("/admin", require("./adminRoutes"));
router.use("/user", require("./userRoutes"));
router.use("/post", require("./postRoutes"));
router.use("/connection", require("./connectionRoutes"));
router.use("/message", require("./messageRoutes"));
router.use("/notification", require("./notificationRoutes"));

module.exports = router;