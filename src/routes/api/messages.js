const express = require("express");
const router = express.Router();
const messageController = require("../../controllers/messageController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory for Supabase upload

router.route("/").get((req, res) => {
  res.json("Messages route");
});

router
  .route("/file")
  .post(upload.single("file"), messageController.upLoadFile)
  .delete(messageController.deleteFile);

router.route("/file/sign-url").get(messageController.getSignedUrl);

module.exports = router;
