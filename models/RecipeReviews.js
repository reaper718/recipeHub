
const { DataTypes } = require("sequelize");
const sequelize = require('../utils/db-connection');

const RecipeReviews = sequelize.define(
    "RecipeReviews",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
                isInt: true
            }
        },

        review: {
            type: DataTypes.TEXT,
            allowNull: true
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

module.exports = RecipeReviews;
