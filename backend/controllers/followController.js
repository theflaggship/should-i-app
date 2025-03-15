// src/controllers/followController.js
const { Follow, User } = require('../models');

/**
 * POST /api/follow
 * Body: { followingId }
 * - Follows a user, ensuring followerId = req.user.id
 */
exports.followUser = async (req, res, next) => {
  try {
    const followerId = req.user.id; // from verifyToken
    const { followingId } = req.body;

    if (!followingId) {
      return res.status(400).json({ error: 'followingId is required' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if already following
    const existing = await Follow.findOne({ where: { followerId, followingId } });
    if (existing) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    const follow = await Follow.create({ followerId, followingId });
    return res.status(201).json({ message: 'User followed', follow });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/follow
 * Body: { followingId }
 * - Unfollows a user, ensuring followerId = req.user.id
 */
exports.unfollowUser = async (req, res, next) => {
  try {
    const followerId = req.user.id;
    const { followingId } = req.body;

    if (!followingId) {
      return res.status(400).json({ error: 'followingId is required' });
    }

    const follow = await Follow.findOne({ where: { followerId, followingId } });
    if (!follow) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    await follow.destroy();
    return res.status(200).json({ message: 'User unfollowed' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/follow/:id/followers
 * - Returns an array of user objects who follow user :id
 *   (i.e., all rows in Follow where followingId = :id)
 */
exports.getFollowers = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // Join with the "follower" user
    const followRecords = await Follow.findAll({
      where: { followingId: userId },
      include: [
        {
          model: User,
          as: 'follower', // must match your association
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'personalSummary'],
        },
      ],
    });

    // Map to an array of user objects
    const followers = followRecords.map((record) => record.follower).filter(Boolean);

    return res.status(200).json(followers);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/follow/:id/following
 * - Returns an array of user objects that user :id is following
 *   (i.e., all rows in Follow where followerId = :id)
 */
exports.getFollowing = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // Join with the "following" user
    const followRecords = await Follow.findAll({
      where: { followerId: userId },
      include: [
        {
          model: User,
          as: 'following', // must match your association
          attributes: ['id', 'username', 'displayName', 'profilePicture', 'personalSummary'],
        },
      ],
    });

    // Map to an array of user objects
    const following = followRecords.map((record) => record.following).filter(Boolean);

    return res.status(200).json(following);
  } catch (error) {
    next(error);
  }
};
