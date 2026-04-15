const express = require("express");
const router = express.Router();

router.use("/auth", require("./authRoutes"));
router.use("/admin", require("./adminRoutes"));
router.use("/user", require("./userRoutes"));


module.exports = router;