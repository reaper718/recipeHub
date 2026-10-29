const express = require("express");
const router = express.Router();

const auth = require("../middelware/auth");
const adminAuth = require("../middelware/adminAuth");

const adminController = require("../controllers/adminController");
const adminUserController = require("../controllers/adminUserController");
const adminRecipeController = require("../controllers/adminRecipeController");
const adminReviewController = require("../controllers/adminReviewController");

router.get("/stats",auth,adminAuth,adminController.getDashboardStats);
router.get("/users", auth, adminAuth, adminUserController.getUsers);

router.delete("/users/:userId", auth,adminAuth, adminUserController.deleteUser);

router.get("/recipes", auth,adminAuth, adminRecipeController.getAllRecipes);

router.delete("/recipes/:recipeId", auth, adminAuth,adminRecipeController.deleteRecipe);

router.get("/reviews", auth, adminAuth, adminReviewController.getAllReviews);

router.delete("/reviews/:reviewId", auth, adminAuth, adminReviewController.deleteReview);

module.exports = router;