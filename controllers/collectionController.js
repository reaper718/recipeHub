
const {
    RecipeCollections,
    CollectionRecipes,
    Recipes
} = require("../models");

// Get all collections belonging to the logged-in user
exports.getCollections = async (req, res) => {
    try {
        const collections = await RecipeCollections.findAll({
            where: {
                UserId: req.user.id
            },
            include: [{
                model: Recipes,
                attributes: ["id", "title", "imageURL", "category"],
                through: {
                    attributes: []
                }
            }],
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            success: true,
            collections
        });
    } catch (error) {
        console.error("Get collections error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch collections."
        });
    }
};


// Create a new collection
exports.createCollection = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Collection name is required."
            });
        }

        if (name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: "Collection name cannot exceed 100 characters."
            });
        }

        const collection = await RecipeCollections.create({
            name: name.trim(),
            description: description?.trim() || null,
            UserId: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Collection created successfully.",
            collection
        });
    } catch (error) {
        console.error("Create collection error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to create collection."
        });
    }
};


// Get one collection and its recipes
exports.getCollection = async (req, res) => {
    try {
        const collection = await RecipeCollections.findOne({
            where: {
                id: req.params.id,
                UserId: req.user.id
            },
            include: [{
                model: Recipes,
                attributes: [
                    "id",
                    "title",
                    "description",
                    "imageURL",
                    "category",
                    "difficulty",
                    "prepTimeMinutes",
                    "cookTimeMinutes"
                ],
                through: {
                    attributes: []
                }
            }]
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found."
            });
        }

        return res.status(200).json({
            success: true,
            collection
        });
    } catch (error) {
        console.error("Get collection error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch collection."
        });
    }
};


// Update a collection
exports.updateCollection = async (req, res) => {
    try {
        const { name, description } = req.body;

        const collection = await RecipeCollections.findOne({
            where: {
                id: req.params.id,
                UserId: req.user.id
            }
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found."
            });
        }

        if (name !== undefined) {
            if (!name.trim() || name.trim().length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Name must contain 1–100 characters."
                });
            }

            collection.name = name.trim();
        }

        if (description !== undefined) {
            collection.description = description.trim() || null;
        }

        await collection.save();

        return res.status(200).json({
            success: true,
            message: "Collection updated successfully.",
            collection
        });
    } catch (error) {
        console.error("Update collection error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update collection."
        });
    }
};


// Delete a collection
exports.deleteCollection = async (req, res) => {
    try {
        const collection = await RecipeCollections.findOne({
            where: {
                id: req.params.id,
                UserId: req.user.id
            }
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found."
            });
        }

        await collection.destroy();

        return res.status(200).json({
            success: true,
            message: "Collection deleted successfully."
        });
    } catch (error) {
        console.error("Delete collection error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete collection."
        });
    }
};


// Add a recipe to a collection
exports.addRecipeToCollection = async (req, res) => {
    try {
        const { id: collectionId, recipeId } = req.params;

        const collection = await RecipeCollections.findOne({
            where: {
                id: collectionId,
                UserId: req.user.id
            }
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found."
            });
        }

        const recipe = await Recipes.findByPk(recipeId);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found."
            });
        }

        const [entry, created] = await CollectionRecipes.findOrCreate({
            where: {
                RecipeCollectionId: collection.id,
                RecipeId: recipe.id
            }
        });

        return res.status(created ? 201 : 200).json({
            success: true,
            message: created
                ? "Recipe added to collection."
                : "Recipe is already in this collection."
        });
    } catch (error) {
        console.error("Add recipe to collection error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to add recipe to collection."
        });
    }
};


// Remove a recipe from a collection
exports.removeRecipeFromCollection = async (req, res) => {
    try {
        const collection = await RecipeCollections.findOne({
            where: {
                id: req.params.id,
                UserId: req.user.id
            }
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found."
            });
        }

        const deleted = await CollectionRecipes.destroy({
            where: {
                RecipeCollectionId: collection.id,
                RecipeId: req.params.recipeId
            }
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Recipe is not in this collection."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Recipe removed from collection."
        });
    } catch (error) {
        console.error("Remove recipe from collection error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to remove recipe from collection."
        });
    }
};
