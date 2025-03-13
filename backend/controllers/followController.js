// src/controllers/followController.js
const { Follow } = require('../models');

/**
 * POST /api/follow
 * Body: { followingId }
 * - Follows a user, ensuring followerId = req.user.id
 */
exports.followUser = async (req, res, next) => {
  try {
    const followerId = req.user.id;         // from verifyToken
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
 * - Returns all rows in Follow where followingId = :id
 *   i.e. "all users who follow user :id"
 */
exports.getFollowers = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const followers = await Follow.findAll({
      where: { followingId: userId },
    });
    // Optionally, do a join to get user details
    return res.status(200).json(followers);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/follow/:id/following
 * - Returns all rows in Follow where followerId = :id
 *   i.e. "all users that user :id is following"
 */
exports.getFollowing = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const following = await Follow.findAll({
      where: { followerId: userId },
    });
    // Optionally, do a join to get user details
    return res.status(200).json(following);
  } catch (error) {
    next(error);
  }
};
