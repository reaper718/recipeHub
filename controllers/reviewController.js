
const {
    RecipeReviews,
    Recipes,
    Users
} = require("../models");

// Validate rating and review text
function validateReview(rating, review) {
    const numericRating = Number(rating);

    if (
        rating === undefined ||
        rating === null ||
        rating === "" ||
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
    ) {
        return {
            valid: false,
            message: "Rating must be a whole number between 1 and 5."
        };
    }

    if (review !== undefined && review !== null &&
        typeof review !== "string") {
        return {
            valid: false,
            message: "Review must be text."
        };
    }

    if (typeof review === "string" && review.length > 2000) {
        return {
            valid: false,
            message: "Review cannot exceed 2000 characters."
        };
    }

    return {
        valid: true,
        rating: numericRating,
        review: typeof review === "string" ? review.trim() : null
    };
}


// GET /reviews/:recipeId
// Get all reviews and the average rating for a recipe
exports.getReviews = async (req, res) => {
    try {
        const recipe = await Recipes.findByPk(req.params.recipeId);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found."
            });
        }

        const reviews = await RecipeReviews.findAll({
            where: {
                RecipeId: recipe.id
            },
            include: [{
                model: Users,
                attributes: ["id", "name"]
            }],
            order: [["createdAt", "DESC"]]
        });

        const totalReviews = reviews.length;

        const averageRating = totalReviews
            ? Number((
                reviews.reduce((sum, item) => sum + item.rating, 0) /
                totalReviews
            ).toFixed(1))
            : 0;

        return res.status(200).json({
            success: true,
            averageRating,
            totalReviews,
            reviews
        });
    } catch (error) {
        console.error("Get reviews error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch reviews."
        });
    }
};


// POST /reviews/:recipeId
// Create a review for a recipe
exports.createReview = async (req, res) => {
    try {
        const { rating, review } = req.body;
        const validation = validateReview(rating, review);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const recipe = await Recipes.findByPk(req.params.recipeId);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found."
            });
        }

        const existingReview = await RecipeReviews.findOne({
            where: {
                UserId: req.user.id,
                RecipeId: recipe.id
            }
        });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this recipe. Update your existing review instead."
            });
        }

        const newReview = await RecipeReviews.create({
            rating: validation.rating,
            review: validation.review,
            UserId: req.user.id,
            RecipeId: recipe.id
        });

        const savedReview = await RecipeReviews.findByPk(newReview.id, {
            include: [{
                model: Users,
                attributes: ["id", "name"]
            }]
        });

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully.",
            review: savedReview
        });
    } catch (error) {
        console.error("Create review error:", error);

        // Also handles a concurrent duplicate submission caught by the unique index.
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this recipe."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to submit review."
        });
    }
};


// PUT /reviews/:recipeId
// Update the logged-in user's review for a recipe
exports.updateReview = async (req, res) => {
    try {
        const { rating, review } = req.body;
        const validation = validateReview(rating, review);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const existingReview = await RecipeReviews.findOne({
            where: {
                UserId: req.user.id,
                RecipeId: req.params.recipeId
            }
        });

        if (!existingReview) {
            return res.status(404).json({
                success: false,
                message: "You have not reviewed this recipe yet."
            });
        }

        existingReview.rating = validation.rating;
        existingReview.review = validation.review;

        await existingReview.save();

        const updatedReview = await RecipeReviews.findByPk(
            existingReview.id,
            {
                include: [{
                    model: Users,
                    attributes: ["id", "name"]
                }]
            }
        );

        return res.status(200).json({
            success: true,
            message: "Review updated successfully.",
            review: updatedReview
        });
    } catch (error) {
        console.error("Update review error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update review."
        });
    }
};


// DELETE /reviews/:recipeId
// Delete the logged-in user's review for a recipe
exports.deleteReview = async (req, res) => {
    try {
        const deleted = await RecipeReviews.destroy({
            where: {
                UserId: req.user.id,
                RecipeId: req.params.recipeId
            }
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "You have not reviewed this recipe yet."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully."
        });
    } catch (error) {
        console.error("Delete review error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete review."
        });
    }
};


exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await RecipeReviews.findAll({
            where: {
                UserId: req.user.id
            },
            include: [{
                model: Recipes,
                attributes: ["id", "title", "imageURL"]
            }],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error("Get my reviews error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your reviews."
        });
    }
};
