const express = require("express");
const router = express.Router();
const messageController = require("../../controllers/messageController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory for Supabase upload

router.post(
  "/file",
  upload.single("file"),
  messageController.createFileMessage
);
router.get("/:conversationId", messageController.getMessagesByConversationId);

module.exports = router;
