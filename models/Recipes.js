const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const Recipes = sequelize.define("Recipes", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    imageURL: {
        type: DataTypes.STRING(1000),
        allowNull: true
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    difficulty: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    dietaryPreferences: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    prepTimeMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cookTimeMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    servings: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Recipes;