const { Follow } = require('../models');

// POST /api/follow - Follow a user
exports.followUser = async (req, res, next) => {
  try {
    const { followerId, followingId } = req.body;
    const follow = await Follow.create({ followerId, followingId });
    res.status(201).json({ message: 'User followed', follow });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/follow - Unfollow a user
exports.unfollowUser = async (req, res, next) => {
  try {
    const { followerId, followingId } = req.body;
    const follow = await Follow.findOne({ where: { followerId, followingId } });
    if (!follow) {
      const err = new Error('Follow relationship not found');
      err.status = 404;
      return next(err);
    }
    await follow.destroy();
    res.status(200).json({ message: 'User unfollowed' });
  } catch (error) {
    next(error);
  }
};

// GET /api/follow/:id/followers - Get followers of a user
exports.getFollowers = async (req, res, next) => {
  try {
    const followers = await Follow.findAll({ where: { followingId: req.params.id } });
    res.status(200).json(followers);
  } catch (error) {
    next(error);
  }
};

// GET /api/follow/:id/following - Get users that a user is following
exports.getFollowing = async (req, res, next) => {
  try {
    const following = await Follow.findAll({ where: { followerId: req.params.id } });
    res.status(200).json(following);
  } catch (error) {
    next(error);
  }
};
