const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const CollectionRecipes = sequelize.define(
    "CollectionRecipes",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        RecipeCollectionId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        RecipeId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ["RecipeCollectionId", "RecipeId"]
            }
        ]
    }
);

module.exports = CollectionRecipes;