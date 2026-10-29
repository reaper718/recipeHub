
const { Users, UserFollows } = require("../models");

exports.followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = Number(req.params.userId);

    if (!Number.isInteger(followingId) || followingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID."
      });
    }

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself."
      });
    }

    const userToFollow = await Users.findByPk(followingId);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const [follow, created] = await UserFollows.findOrCreate({
      where: { FollowerId: followerId, FollowingId: followingId }
    });

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created
        ? "User followed successfully."
        : "You already follow this user.",
      following: true
    });
  } catch (error) {
    console.error("Follow user error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to follow user."
    });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = Number(req.params.userId);

    if (!Number.isInteger(followingId) || followingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID."
      });
    }

    const deleted = await UserFollows.destroy({
      where: {
        FollowerId: followerId,
        FollowingId: followingId
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "You do not follow this user."
      });
    }

    return res.status(200).json({
      success: true,
      message: "User unfollowed successfully.",
      following: false
    });
  } catch (error) {
    console.error("Unfollow user error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to unfollow user."
    });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const follows = await UserFollows.findAll({
      where: { FollowerId: req.user.id },
      include: [{
        model: Users,
        as: "Following",
        attributes: ["id", "name", "email"]
      }],
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      users: follows.map(item => item.Following)
    });
  } catch (error) {
    console.error("Get following error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch following list."
    });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const follows = await UserFollows.findAll({
      where: { FollowingId: req.user.id },
      include: [{
        model: Users,
        as: "Follower",
        attributes: ["id", "name", "email"]
      }],
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      success: true,
      users: follows.map(item => item.Follower)
    });
  } catch (error) {
    console.error("Get followers error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch followers list."
    });
  }
};

exports.getFollowStatus = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID."
      });
    }

    const user = await Users.findByPk(userId, {
      attributes: ["id"]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (userId === req.user.id) {
      return res.status(200).json({
        success: true,
        following: false,
        isSelf: true
      });
    }

    const follow = await UserFollows.findOne({
      where: {
        FollowerId: req.user.id,
        FollowingId: userId
      }
    });

    return res.status(200).json({
      success: true,
      following: Boolean(follow),
      isSelf: false
    });
  } catch (error) {
    console.error("Follow status error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to check follow status."
    });
  }
};
