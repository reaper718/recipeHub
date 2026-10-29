const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const RecipeInstructions = sequelize.define("RecipeInstructions", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    stepNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    instruction: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

module.exports = RecipeInstructions;