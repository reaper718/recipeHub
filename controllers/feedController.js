const { Op } = require("sequelize");
const { UserFollows, Recipes, RecipeReviews, Users } = require("../models");

const getActivityFeed = async (req, res) => {
  try {
    const follows = await UserFollows.findAll({
      where: { FollowerId: req.user.id },
      attributes: ["FollowingId"]
    });

    const followingIds = follows.map(item => item.FollowingId);

    if (followingIds.length === 0) {
      return res.status(200).json({
        success: true,
        activities: []
      });
    }

    const [recipes, reviews] = await Promise.all([
      Recipes.findAll({
        where: {
          UserId: { [Op.in]: followingIds }
        },
        include: [{
          model: Users,
          attributes: ["id", "name"]
        }],
        order: [["createdAt", "DESC"]],
        limit: 50
      }),

      RecipeReviews.findAll({
        where: {
          UserId: { [Op.in]: followingIds }
        },
        include: [
          {
            model: Users,
            attributes: ["id", "name"]
          },
          {
            model: Recipes,
            attributes: ["id", "title", "imageURL"]
          }
        ],
        order: [["createdAt", "DESC"]],
        limit: 50
      })
    ]);

    const recipeActivities = recipes.map(recipe => ({
      type: "recipe",
      createdAt: recipe.createdAt,
      user: recipe.User
        ? { id: recipe.User.id, name: recipe.User.name }
        : null,
      recipe: {
        id: recipe.id,
        title: recipe.title,
        imageURL: recipe.imageURL,
        description: recipe.description
      }
    }));

    const reviewActivities = reviews.map(review => ({
      type: "review",
      createdAt: review.createdAt,
      user: review.User
        ? { id: review.User.id, name: review.User.name }
        : null,
      review: {
        rating: review.rating,
        text: review.review
      },
      recipe: review.Recipe
        ? {
            id: review.Recipe.id,
            title: review.Recipe.title,
            imageURL: review.Recipe.imageURL
          }
        : null
    }));

    const activities = [...recipeActivities, ...reviewActivities]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);

    return res.status(200).json({
      success: true,
      activities
    });
  } catch (error) {
    console.error("Get activity feed error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch activity feed."
    });
  }
};

module.exports = {
  getActivityFeed
}