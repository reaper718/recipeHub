const { Op } = require("sequelize");

const Recipes = require("../models/Recipes");
const RecipeIngredients = require("../models/RecipeIngredients");
const RecipeInstructions = require("../models/RecipeInstructions");

const getAllRecipes = async (req, res) => {
    try {
        const {
            search,
            ingredient,
            category,
            difficulty,
            dietaryPreference,
            maxPrepTime
        } = req.query;

        const where = {};

        // Search recipe title or description.
        if (search && search.trim()) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search.trim()}%` } },
                { description: { [Op.like]: `%${search.trim()}%` } }
            ];
        }

        if (category) {
            where.category = category;
        }

        if (difficulty) {
            where.difficulty = difficulty;
        }

        if (dietaryPreference) {
            const allowedPreferences = [
                "vegetarian",
                "vegan",
                "gluten-free"
            ];

            if (!allowedPreferences.includes(dietaryPreference)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid dietary preference"
                });
            }

            // MySQL JSON array membership.
            where.dietaryPreferences = {
                [Op.like]: `%${dietaryPreference}%`
            };
        }

        if (maxPrepTime !== undefined) {
            const prepTime = Number(maxPrepTime);

            if (!Number.isInteger(prepTime) || prepTime < 0) {
                return res.status(400).json({
                    success: false,
                    message: "maxPrepTime must be a non-negative integer"
                });
            }

            where.prepTimeMinutes = {
                [Op.lte]: prepTime
            };
        }

        const recipes = await Recipes.findAll({
            where,
            order: [["createdAt", "DESC"]]
        });

        let result = recipes.map(recipe => recipe.toJSON());

        // Search by ingredient name.
        if (ingredient && ingredient.trim()) {
            const matchingIngredients =
                await RecipeIngredients.findAll({
                    where: {
                        name: {
                            [Op.like]: `%${ingredient.trim()}%`
                        }
                    },
                    attributes: ["RecipeId"]
                });

            const matchingIds = new Set(
                matchingIngredients.map(item =>
                    Number(item.RecipeId)
                )
            );

            result = result.filter(recipe =>
                matchingIds.has(Number(recipe.id))
            );
        }

        const recipeIds = result.map(recipe => recipe.id);

        const [ingredients, instructions] = recipeIds.length
            ? await Promise.all([
                RecipeIngredients.findAll({
                    where: {
                        RecipeId: { [Op.in]: recipeIds }
                    }
                }),
                RecipeInstructions.findAll({
                    where: {
                        RecipeId: { [Op.in]: recipeIds }
                    },
                    order: [["stepNumber", "ASC"]]
                })
            ])
            : [[], []];

        result = result.map(recipe => ({
            ...recipe,
            ingredients: ingredients.filter(
                item => Number(item.RecipeId) === Number(recipe.id)
            ),
            instructions: instructions.filter(
                item => Number(item.RecipeId) === Number(recipe.id)
            )
        }));

        return res.status(200).json({
            success: true,
            count: result.length,
            recipes: result
        });
    } catch (error) {
        console.error("getAllRecipes error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch recipes"
        });
    }
};

const getMyRecipes = async (req, res) => {
    try {
        const userId = req.user.id;

        const recipes = await Recipes.findAll({
            where: { UserId: userId },
            order: [["createdAt", "DESC"]]
        });

        const recipeIds = recipes.map(recipe => recipe.id);

        const [ingredients, instructions] = recipeIds.length
            ? await Promise.all([
                RecipeIngredients.findAll({
                    where: { RecipeId: { [Op.in]: recipeIds } }
                }),
                RecipeInstructions.findAll({
                    where: { RecipeId: { [Op.in]: recipeIds } },
                    order: [["stepNumber", "ASC"]]
                })
            ])
            : [[], []];

        const result = recipes.map(recipe => ({
            ...recipe.toJSON(),
            ingredients: ingredients.filter(
                item => item.RecipeId === recipe.id
            ),
            instructions: instructions.filter(
                item => item.RecipeId === recipe.id
            )
        }));

        return res.status(200).json({
            success: true,
            recipes: result
        });
    } catch (error) {
        console.error("getMyRecipes error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your recipes"
        });
    }
};

const getRecipe = async (req, res) => {
    try {
        const id = req.params.id;

        const recipe = await Recipes.findByPk(id);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe does not exist"
            });
        }

        const [ingredients, instructions] = await Promise.all([
            RecipeIngredients.findAll({
                where: { RecipeId: recipe.id }
            }),
            RecipeInstructions.findAll({
                where: { RecipeId: recipe.id },
                order: [["stepNumber", "ASC"]]
            })
        ]);

        return res.status(200).json({
            success: true,
            recipe: {
                ...recipe.toJSON(),
                ingredients,
                instructions
            }
        });
    } catch (error) {
        console.error("getRecipe error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch the recipe"
        });
    }
};

const addRecipe = async (req, res) => {
    console.log("Request body:", req.body);
    console.log("Image URL:", req.body.imageURL);
    const transaction = await Recipes.sequelize.transaction();

    try {
        const userId = req.user.id;

        const {
            title,
            description,
            imageURL,
            category,
            difficulty,
            dietaryPreferences = [],
            prepTimeMinutes,
            cookTimeMinutes,
            servings,
            ingredients = [],
            instructions = []
        } = req.body;

        if (!title || !title.trim()) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: "Recipe title is required"
            });
        }

        if (!Array.isArray(ingredients) || !Array.isArray(instructions)) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: "Ingredients and instructions must be arrays"
            });
        }

        const recipe = await Recipes.create({
            title: title.trim(),
            description,
            imageURL,
            category,
            difficulty,
            dietaryPreferences,
            prepTimeMinutes,
            cookTimeMinutes,
            servings,
            UserId: userId
        }, { transaction });

        if (ingredients.length) {
            await RecipeIngredients.bulkCreate(
                ingredients.map(item => ({
                    RecipeId: recipe.id,
                    name: item.name,
                    quantity: item.quantity ?? null,
                    unit: item.unit ?? null
                })),
                { transaction }
            );
        }

        if (instructions.length) {
            await RecipeInstructions.bulkCreate(
                instructions.map((item, index) => ({
                    RecipeId: recipe.id,
                    stepNumber: item.stepNumber ?? index + 1,
                    instruction: typeof item === "string"
                        ? item
                        : item.instruction
                })),
                { transaction }
            );
        }

        await transaction.commit();

        return res.status(201).json({
            success: true,
            message: "Recipe added successfully",
            recipe: {
                ...recipe.toJSON(),
                ingredients,
                instructions
            }
        });
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        console.error("addRecipe error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add recipe"
        });
    }
};

const editRecipe = async (req, res) => {
    const transaction = await Recipes.sequelize.transaction();

    try {
        const id = req.params.id;
        const userId = req.user.id;

        const recipe = await Recipes.findByPk(id, { transaction });

        if (!recipe) {
            await transaction.rollback();

            return res.status(404).json({
                success: false,
                message: "Recipe does not exist"
            });
        }

        if (String(recipe.UserId) !== String(userId)) {
            await transaction.rollback();

            return res.status(403).json({
                success: false,
                message: "You cannot edit another user's recipe"
            });
        }

        const allowedFields = [
            "title",
            "description",
            "imageURL",
            "category",
            "difficulty",
            "prepTimeMinutes",
            "cookTimeMinutes",
            "servings"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        await recipe.update(updates, { transaction });

        // Replace ingredients only when the client sends that field.
        if (req.body.ingredients !== undefined) {
            if (!Array.isArray(req.body.ingredients)) {
                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Ingredients must be an array"
                });
            }

            await RecipeIngredients.destroy({
                where: { RecipeId: recipe.id },
                transaction
            });

            if (req.body.ingredients.length) {
                await RecipeIngredients.bulkCreate(
                    req.body.ingredients.map(item => ({
                        RecipeId: recipe.id,
                        name: item.name,
                        quantity: item.quantity ?? null,
                        unit: item.unit ?? null
                    })),
                    { transaction }
                );
            }
        }

        // Replace instructions only when the client sends that field.
        if (req.body.instructions !== undefined) {
            if (!Array.isArray(req.body.instructions)) {
                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Instructions must be an array"
                });
            }

            await RecipeInstructions.destroy({
                where: { RecipeId: recipe.id },
                transaction
            });

            if (req.body.instructions.length) {
                await RecipeInstructions.bulkCreate(
                    req.body.instructions.map((item, index) => ({
                        RecipeId: recipe.id,
                        stepNumber: item.stepNumber ?? index + 1,
                        instruction: typeof item === "string"
                            ? item
                            : item.instruction
                    })),
                    { transaction }
                );
            }
        }

        await transaction.commit();

        const [ingredients, instructions] = await Promise.all([
            RecipeIngredients.findAll({
                where: { RecipeId: recipe.id }
            }),
            RecipeInstructions.findAll({
                where: { RecipeId: recipe.id },
                order: [["stepNumber", "ASC"]]
            })
        ]);

        return res.status(200).json({
            success: true,
            message: "Recipe updated successfully",
            recipe: {
                ...recipe.toJSON(),
                ingredients,
                instructions
            }
        });
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        console.error("editRecipe error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to edit recipe"
        });
    }
};

const deleteRecipe = async (req, res) => {
    const transaction = await Recipes.sequelize.transaction();

    try {
        const id = req.params.id;
        const userId = req.user.id;

        const recipe = await Recipes.findByPk(id, { transaction });

        if (!recipe) {
            await transaction.rollback();

            return res.status(404).json({
                success: false,
                message: "Recipe does not exist"
            });
        }

        if (String(recipe.UserId) !== String(userId)) {
            await transaction.rollback();

            return res.status(403).json({
                success: false,
                message: "You cannot delete another user's recipe"
            });
        }

        await RecipeInstructions.destroy({
            where: { RecipeId: recipe.id },
            transaction
        });

        await RecipeIngredients.destroy({
            where: { RecipeId: recipe.id },
            transaction
        });

        await recipe.destroy({ transaction });

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: "Recipe deleted successfully"
        });
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        console.error("deleteRecipe error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete recipe"
        });
    }
};

module.exports = {
    getAllRecipes,
    getMyRecipes,
    getRecipe,
    addRecipe,
    editRecipe,
    deleteRecipe
};
