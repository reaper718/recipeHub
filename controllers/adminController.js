const {
    Users,
    Recipes,
    RecipeReviews
} = require("../models");

const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalRecipes, totalReviews] =
            await Promise.all([
                Users.count(),
                Recipes.count(),
                RecipeReviews.count()
            ]);

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalRecipes,
                totalReviews,
                totalReports: 0
            }
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch dashboard statistics."
        });
    }
};

module.exports = {
    getDashboardStats
}