const { Vote } = require('../models');

// POST /api/votes - Cast a vote
exports.castVote = async (req, res, next) => {
  try {
    // We assume your auth middleware sets req.user.id
    const userId = req.user.id;
    const { pollId, optionId } = req.body;

    // Check if the user has already voted in this poll
    const existingVote = await Vote.findOne({ where: { userId, pollId } });

    if (existingVote) {
      existingVote.optionId = optionId;
      await existingVote.save();
      return res.status(200).json({ message: 'Vote updated.' });
    } else {
      await Vote.create({ userId, pollId, optionId });
      return res.status(201).json({ message: 'Vote cast.' });
    }
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
