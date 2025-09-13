const express = require("express");
const userRoute = require("./user.route");
const docsRoute = require("./docs.route");
const authRoute = require("./auth.route");

const router = express.Router();

router.use("/users", userRoute);
router.use("/docs", docsRoute);
router.use("/auth", authRoute);

module.exports = router;
