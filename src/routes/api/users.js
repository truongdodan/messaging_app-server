const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");

router.route("/").get(userController.getAny).patch(userController.updateOne);

router.route("/:id").get(userController.getOne);

module.exports = router;
