const express = require("express");
const router = express.Router();
const refreshController = require("../controllers/auth/refreshController");

router.route("/").get(refreshController);

module.exports = router;
