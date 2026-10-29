const { Op } = require("sequelize");
const { RecipeReviews, Users, Recipes } = require("../models");

const getAllReviews = async (req, res) => {
    try {
        const search = (req.query.search || "").trim();

        const where = {};

        if (search) {
            where[Op.or] = [
                { review: { [Op.like]: `%${search}%` } },
                { "$User.name$": { [Op.like]: `%${search}%` } },
                { "$User.email$": { [Op.like]: `%${search}%` } },
                { "$Recipe.title$": { [Op.like]: `%${search}%` } }
            ];
        }

        const reviews = await RecipeReviews.findAll({
            where,
            include: [
                {
                    model: Users,
                    attributes: ["id", "name", "email"]
                },
                {
                    model: Recipes,
                    attributes: ["id", "title"]
                }
            ],
            order: [["createdAt", "DESC"]],
            limit: 100,
            subQuery: false
        });

        return res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error("Admin get reviews error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch reviews."
        });
    }
};

const deleteReview = async (req, res) => {
    try {
        const reviewId = Number(req.params.reviewId);

        if (!Number.isInteger(reviewId) || reviewId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID."
            });
        }

        const review = await RecipeReviews.findByPk(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found."
            });
        }

        await review.destroy();

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully.",
            deletedReviewId: reviewId
        });
    } catch (error) {
        console.error("Admin delete review error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete review."
        });
    }
};

module.exports = {
    getAllReviews,
    deleteReview
}