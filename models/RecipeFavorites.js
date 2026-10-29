const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const RecipeFavorites = sequelize.define(
    "RecipeFavorites",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        UserId: {
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
                fields: ["UserId", "RecipeId"]
            }
        ]
    }
);

module.exports = RecipeFavorites;