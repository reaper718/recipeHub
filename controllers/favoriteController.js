const {
    Recipes,
    RecipeFavorites
} = require("../models");

// Get all favorites belonging to the logged-in user
exports.getFavorites = async (req, res) => {
    try {
        const favorites = await RecipeFavorites.findAll({
            where: {
                UserId: req.user.id
            },
            include: [
                {
                    model: Recipes,
                    required: true
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            favorites: favorites.map(item => item.Recipe)
        });
    } catch (error) {
        console.error("Get favorites error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch favorites."
        });
    }
};

// Add a recipe to favorites
exports.addFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const recipeId = req.params.id;

        const recipe = await Recipes.findByPk(recipeId);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found."
            });
        }

        const [favorite, created] = await RecipeFavorites.findOrCreate({
            where: {
                UserId: userId,
                RecipeId: recipeId
            },
            defaults: {
                UserId: userId,
                RecipeId: recipeId
            }
        });

        return res.status(created ? 201 : 200).json({
            success: true,
            message: created
                ? "Recipe added to favorites."
                : "Recipe is already in favorites.",
            favorite
        });
    } catch (error) {
        console.error("Add favorite error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add favorite."
        });
    }
};

// Remove a recipe from favorites
exports.removeFavorite = async (req, res) => {
    try {
        const deleted = await RecipeFavorites.destroy({
            where: {
                UserId: req.user.id,
                RecipeId: req.params.id
            }
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Favorite not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Recipe removed from favorites."
        });
    } catch (error) {
        console.error("Remove favorite error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove favorite."
        });
    }
};
