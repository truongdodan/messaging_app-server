const express = require('express');
const router = express.Router();

router.route("/")
    .get((req, res) => {
        res.json("Messages route");
    })

module.exports = router;