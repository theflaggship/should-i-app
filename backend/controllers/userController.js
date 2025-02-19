const { User, Poll, Vote } = require('../models');

// GET /api/users/:id - Retrieve a user profile (excluding password)
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      return next(err);
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id - Update a user profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      return next(err);
    }
    await user.update(req.body);
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/polls - Retrieve all polls created by the user
exports.getUserPolls = async (req, res, next) => {
  try {
    const polls = await Poll.findAll({ where: { userId: req.params.id } });
    res.status(200).json(polls);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/votes - Retrieve all votes cast by the user
exports.getUserVotes = async (req, res, next) => {
  try {
    const votes = await Vote.findAll({ where: { userId: req.params.id } });
    res.status(200).json(votes);
  } catch (error) {
    next(error);
  }
};
