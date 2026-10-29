const express = require("express");
const router = express.Router();

const auth = require("../middelware/auth");
const feedController = require("../controllers/feedController");

router.get("/", auth, feedController.getActivityFeed);

module.exports = router;
