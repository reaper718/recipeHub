const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const RecipeCollections = sequelize.define("RecipeCollections", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = RecipeCollections;