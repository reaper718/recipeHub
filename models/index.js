const Users = require("./Users");
const Recipes = require("./Recipes");
const RecipeIngredients = require("./RecipeIngredients");
const RecipeInstructions = require("./RecipeInstructions");
const RecipeReviews = require("./RecipeReviews");
const RecipeFavorites = require("./RecipeFavorites");
const RecipeCollections = require("./RecipeCollections");
const CollectionRecipes = require("./CollectionRecipes");
const UserFollows = require("./UserFollows");

// Existing associations
Users.hasMany(Recipes, {
    foreignKey: "UserId",
    onDelete: "CASCADE"
});

Recipes.belongsTo(Users, {
    foreignKey: "UserId"
});

Recipes.hasMany(RecipeIngredients, {
    foreignKey: "RecipeId",
    onDelete: "CASCADE"
});

RecipeIngredients.belongsTo(Recipes, {
    foreignKey: "RecipeId"
});

Recipes.hasMany(RecipeInstructions, {
    foreignKey: "RecipeId",
    onDelete: "CASCADE"
});

RecipeInstructions.belongsTo(Recipes, {
    foreignKey: "RecipeId"
});

// Favorites
Users.hasMany(RecipeFavorites, {
    foreignKey: "UserId",
    onDelete: "CASCADE"
});

RecipeFavorites.belongsTo(Users, {
    foreignKey: "UserId"
});

Recipes.hasMany(RecipeFavorites, {
    foreignKey: "RecipeId",
    onDelete: "CASCADE"
});

RecipeFavorites.belongsTo(Recipes, {
    foreignKey: "RecipeId"
});

// Collections
Users.hasMany(RecipeCollections, {
    foreignKey: "UserId",
    onDelete: "CASCADE"
});

RecipeCollections.belongsTo(Users, {
    foreignKey: "UserId"
});

// Recipes inside collections
RecipeCollections.belongsToMany(Recipes, {
    through: CollectionRecipes,
    foreignKey: "RecipeCollectionId",
    otherKey: "RecipeId"
});

Recipes.belongsToMany(RecipeCollections, {
    through: CollectionRecipes,
    foreignKey: "RecipeId",
    otherKey: "RecipeCollectionId"
});

// User <-> Recipe Reviews
Users.hasMany(RecipeReviews, {
    foreignKey: "UserId",
    onDelete: "CASCADE"
});

RecipeReviews.belongsTo(Users, {
    foreignKey: "UserId"
});

// Recipe <-> Recipe Reviews
Recipes.hasMany(RecipeReviews, {
    foreignKey: "RecipeId",
    onDelete: "CASCADE"
});

RecipeReviews.belongsTo(Recipes, {
    foreignKey: "RecipeId"
});

// A user follows another user
Users.hasMany(UserFollows, {
  foreignKey: "FollowerId",
  as: "FollowingUsers",
  onDelete: "CASCADE"
});

Users.hasMany(UserFollows, {
  foreignKey: "FollowingId",
  as: "Followers",
  onDelete: "CASCADE"
});

// Identify the follower and the user being followed
UserFollows.belongsTo(Users, {
  foreignKey: "FollowerId",
  as: "Follower"
});

UserFollows.belongsTo(Users, {
  foreignKey: "FollowingId",
  as: "Following"
});

module.exports = {
    Users,
    Recipes,
    RecipeIngredients,
    RecipeInstructions,
    RecipeFavorites,
    RecipeCollections,
    CollectionRecipes,
    RecipeReviews,
    UserFollows
};