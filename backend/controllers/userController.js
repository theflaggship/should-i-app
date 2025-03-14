// userController.js
const { User, Poll, Vote, Comment, PollOption, Follow } = require('../models');

// GET /api/users/:id - Retrieve a user profile (excluding password)
exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }, 
      // This includes displayName, status, personalSummary, profilePicture
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // We'll attach amIFollowing if user is not the same
    let amIFollowing = false;
    if (req.user.id !== userId) {
      const existing = await Follow.findOne({
        where: { followerId: req.user.id, followingId: userId },
      });
      amIFollowing = !!existing;
    }

    // Convert to JSON and attach amIFollowing
    const userData = user.toJSON();
    userData.amIFollowing = amIFollowing;

    return res.status(200).json(userData);
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id - Update a user profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only update the fields we allow
    const {
      displayName,
      status,
      personalSummary,
      profilePicture
    } = req.body;

    if (displayName !== undefined) user.displayName = displayName;
    if (status !== undefined) user.status = status;
    if (personalSummary !== undefined) user.personalSummary = personalSummary;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    return res.status(200).json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/polls
exports.getUserPolls = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const requestingUserId = req.user?.id;

    const polls = await Poll.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture'], 
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'optionText', 'votes', 'sortOrder'],
          separate: true,
          order: [['sortOrder', 'ASC']],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id', 'commentText', 'createdAt'],
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'profilePicture'] }
          ]
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // (Optional) If the requesting user is logged in, find their votes:
    let userVotesByPollId = {};
    if (requestingUserId) {
      const pollIds = polls.map((p) => p.id);
      const userVotes = await Vote.findAll({
        where: { userId: requestingUserId, pollId: pollIds },
      });
      userVotes.forEach((vote) => {
        userVotesByPollId[vote.pollId] = vote.pollOptionId;
      });
    }

    // Transform each poll if you want
    const data = polls.map((poll) => {
      const userVote = userVotesByPollId[poll.id] || null;
      const commentCount = poll.comments?.length || 0;

      return {
        id: poll.id,
        question: poll.question,
        createdAt: poll.createdAt,
        allowComments: poll.allowComments,
        commentCount,
        userVote,
        user: poll.user
          ? {
              id: poll.user.id,
              username: poll.user.username,
              profilePicture: poll.user.profilePicture,
            }
          : null,
        options: poll.options.map((opt) => ({
          id: opt.id,
          text: opt.optionText,
          votes: opt.votes,
        })),
        comments: (poll.comments || []).map((c) => ({
          id: c.id,
          text: c.commentText,
          createdAt: c.createdAt,
          User: c.user
            ? {
                id: c.user.id,
                username: c.user.username,
                profilePicture: c.user.profilePicture,
              }
            : null
        })),
      };
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/comments - Retrieve all comments made by the user
exports.getUserComments = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const comments = await Comment.findAll({
      where: { userId },
      include: [
        {
          model: Poll,
          as: 'poll',
          attributes: ['id', 'question', 'createdAt'],
          include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'profilePicture'] }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/votes
exports.getUserVotes = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const votes = await Vote.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: PollOption,
          as: 'pollOption',
          attributes: ['id', 'optionText', 'votes', 'pollId', 'sortOrder'],
          include: [
            {
              model: Poll,
              as: 'poll',
              attributes: ['id', 'question', 'createdAt', 'allowComments'],
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'username', 'profilePicture'],
                },
                {
                  model: PollOption,
                  as: 'options',
                  attributes: ['id', 'optionText', 'votes', 'sortOrder'],
                },
                {
                  model: Comment,
                  as: 'comments',
                  attributes: ['id', 'commentText', 'createdAt'],
                  include: [
                    {
                      model: User,
                      as: 'user',
                      attributes: ['id', 'username', 'profilePicture'],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture'],
        },
      ],
    });

    // Transform each vote => poll object
    const results = votes.map((vote) => {
      const pollOpt = vote.pollOption;
      if (!pollOpt) return null;

      const poll = pollOpt.poll;
      if (!poll) return null;

      // The user’s voted option ID
      const userVote = pollOpt.id;

      // Build final poll shape
      const pollData = {
        id: poll.id,
        question: poll.question,
        createdAt: poll.createdAt,
        allowComments: poll.allowComments,
        commentCount: (poll.comments || []).length,
        userVote,
        user: poll.user
          ? {
              id: poll.user.id,
              username: poll.user.username,
              profilePicture: poll.user.profilePicture,
            }
          : null,
        options: (poll.options || []).map((opt) => ({
          id: opt.id,
          text: opt.optionText,
          votes: opt.votes,
          sortOrder: opt.sortOrder,
        })),
        comments: (poll.comments || []).map((c) => ({
          id: c.id,
          text: c.commentText,
          createdAt: c.createdAt,
          user: c.user
            ? {
                id: c.user.id,
                username: c.user.username,
                profilePicture: c.user.profilePicture,
              }
            : null,
        })),
      };

      return pollData;
    }).filter(Boolean);

    return res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/stats
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalPolls = await Poll.count({ where: { userId } });
    const totalVotes = await Vote.count({ where: { userId } });
    const followers = await Follow.count({ where: { followingId: userId } });
    const following = await Follow.count({ where: { followerId: userId } });

    return res.status(200).json({
      followers,
      following,
      totalPolls,
      totalVotes,
    });
  } catch (error) {
    next(error);
  }
};
