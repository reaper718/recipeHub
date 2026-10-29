
const express = require("express");
const router = express.Router();

const auth = require("../middelware/auth");
const followController = require("../controllers/followController");

router.get("/following", auth, followController.getFollowing);
router.get("/followers", auth, followController.getFollowers);
router.get("/status/:userId", auth, followController.getFollowStatus);

router.post("/:userId", auth, followController.followUser);
router.delete("/:userId", auth, followController.unfollowUser);

module.exports = router;
