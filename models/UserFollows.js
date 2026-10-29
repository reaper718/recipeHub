
const { DataTypes } = require("sequelize");
const sequelize = require('../utils/db-connection');

const UserFollows = sequelize.define(
  "UserFollows",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    FollowerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    FollowingId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["FollowerId", "FollowingId"]
      }
    ],
    validate: {
      cannotFollowSelf() {
        if (this.FollowerId === this.FollowingId) {
          throw new Error("You cannot follow yourself.");
        }
      }
    }
  }
);

module.exports = UserFollows;
