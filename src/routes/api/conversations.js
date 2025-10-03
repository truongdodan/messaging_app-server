const express = require("express");
const router = express.Router();
const conversationController = require("../../controllers/conversationController");

router.route("/").get(conversationController.getAny);
router.route("/global").get(conversationController.getGlobalConversation);
router.route("/check/:id").get(conversationController.haveConversationWith);
router.route("/:id").get(conversationController.getOneAndAllMessages);

module.exports = router;
