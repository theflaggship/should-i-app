const { Vote } = require('../models');

// POST /api/votes - Cast a vote
exports.castVote = async (req, res, next) => {
  try {
    const { userId, pollId, pollOptionId } = req.body;
    const vote = await Vote.create({ userId, pollId, pollOptionId });
    res.status(201).json({ message: 'Vote cast successfully', vote });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/votes - Remove a vote
exports.removeVote = async (req, res, next) => {
  try {
    const { userId, pollId } = req.body;
    const vote = await Vote.findOne({ where: { userId, pollId } });
    if (!vote) {
      const err = new Error('Vote not found');
      err.status = 404;
      return next(err);
    }
    await vote.destroy();
    res.status(200).json({ message: 'Vote removed successfully' });
  } catch (error) {
    next(error);
  }
};
