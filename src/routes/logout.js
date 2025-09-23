const express = require("express");
const router = express.Router();
const logoutController = require("../controllers/auth/logoutController");

router.route("/").post(logoutController);

module.exports = router;
