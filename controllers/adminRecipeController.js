const { Op } = require("sequelize");
const { Recipes, Users } = require("../models");

const getAllRecipes = async (req, res) => {
    try {
        const search = (req.query.search || "").trim();

        const where = {};

        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { category: { [Op.like]: `%${search}%` } }
            ];
        }

        const recipes = await Recipes.findAll({
            where,
            include: [{
                model: Users,
                attributes: ["id", "name", "email"]
            }],
            order: [["createdAt", "DESC"]],
            limit: 100
        });

        return res.status(200).json({
            success: true,
            recipes
        });
    } catch (error) {
        console.error("Admin get recipes error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch recipes."
        });
    }
};

const deleteRecipe = async (req, res) => {
    try {
        const recipeId = Number(req.params.recipeId);

        if (!Number.isInteger(recipeId) || recipeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid recipe ID."
            });
        }

        const recipe = await Recipes.findByPk(recipeId);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found."
            });
        }

        await recipe.destroy();

        return res.status(200).json({
            success: true,
            message: "Recipe deleted successfully.",
            deletedRecipeId: recipeId
        });
    } catch (error) {
        console.error("Admin delete recipe error:", error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete recipe. Check related records and foreign-key constraints."
        });
    }
};


module.exports = {
    getAllRecipes,
    deleteRecipe
}