const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const RecipeIngredients = sequelize.define("RecipeIngredients", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    unit: {
        type: DataTypes.STRING(40),
        allowNull: true
    }
});

module.exports = RecipeIngredients;