const express = require("express");
const userRoute = require("./user.route");
const docsRoute = require("./docs.route");

const router = express.Router();

router.use("/users", userRoute);
router.use("/docs", docsRoute);

module.exports = router;
