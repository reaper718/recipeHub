
const express = require("express");
const router = express.Router();

const auth = require("../middelware/auth");
const reviewController = require("../controllers/reviewController");

router.get("/:recipeId", auth, reviewController.getReviews);

router.post("/:recipeId", auth, reviewController.createReview);

router.put("/:recipeId", auth, reviewController.updateReview);
router.get("/my-reviews", auth, reviewController.getMyReviews);
router.delete("/:recipeId", auth, reviewController.deleteReview);

module.exports = router;
