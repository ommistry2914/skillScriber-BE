const express = require("express");
const { authController } = require("../../controllers");
const validate = require("../../middlewares/validate");
const { loginSchema } = require("../../validations/auth.validation");


const router = express.Router();

router.post("/login",validate(loginSchema) ,authController.loginUser);

module.exports = router;
