const express = require("express");
const router = express.Router();
const multer = require("multer");
const asyncHandler = require("express-async-handler");
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory for Supabase upload
const {
  getPublicUrl,
  uploadPublicFile,
} = require("../../services/fileService");
const CustomError = require("../../errors/CustomError");

// Upload profile/cover image to PUBLIC bucket
router.post(
  "/profile",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const file = req.file;

    if (!file) {
      throw new CustomError("Input Error", "No file provided", 400);
    }

    if (!file.mimetype.startsWith("image/")) {
      throw new CustomError("Input Error", "Only images allowed", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new CustomError("Input Error", "File too large (max 5MB)", 400);
    }

    const fileData = await uploadPublicFile(file);
    const publicUrl = getPublicUrl(fileData.path);

    res.json({
      path: fileData.path,
      url: publicUrl,
    });
  })
);

module.exports = router;
