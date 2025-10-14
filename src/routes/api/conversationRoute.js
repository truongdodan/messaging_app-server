const express = require("express");
const router = express.Router();
const conversationController = require("../../controllers/conversationController");

router.route("/").get(conversationController.getAny);

module.exports = router;
