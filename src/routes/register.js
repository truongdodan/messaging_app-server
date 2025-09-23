const express = require("express");
const router = express.Router();
const registerController = require("../controllers/auth/registerController");

router.route("/").post(registerController.handleRegister);

module.exports = router;
