// userController.js
const { User, Poll, Vote, Comment, PollOption, Follow } = require('../models');

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
          // Attach comments using the correct alias
          model: Comment,
          as: 'comments', // <-- THIS is critical
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
      // Include the poll data so we can display poll question, etc.
      include: [
        {
          model: Poll,
          as: 'poll',
          attributes: ['id', 'question', 'createdAt'],
          // optionally also include poll's user if needed
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

// GET /api/users/:id/votes - Retrieve all votes cast by the user
// userController.js
// GET /api/users/:id/votes
exports.getUserVotes = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const votes = await Vote.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          // Must match Vote.belongsTo(PollOption, { as: 'pollOption' })
          model: PollOption,
          as: 'pollOption',
          attributes: ['id', 'optionText', 'votes', 'pollId', 'sortOrder'], // <--- INCLUDE sortOrder
          include: [
            {
              // Must match PollOption.belongsTo(Poll, { as: 'poll' })
              model: Poll,
              as: 'poll',
              attributes: ['id', 'question', 'createdAt', 'allowComments'],
              include: [
                {
                  // Must match Poll.belongsTo(User, { as: 'user' })
                  model: User,
                  as: 'user',
                  attributes: ['id', 'username', 'profilePicture'],
                },
                {
                  // Must match Poll.hasMany(PollOption, { as: 'options' })
                  model: PollOption,
                  as: 'options',
                  attributes: ['id', 'optionText', 'votes', 'sortOrder'], // <--- INCLUDE sortOrder here too
                },
                {
                  // Must match Poll.hasMany(Comment, { as: 'comments' })
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
          // Must match Vote.belongsTo(User, { as: 'user' })
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
        // Attach options, including sortOrder
        options: (poll.options || []).map((opt) => ({
          id: opt.id,
          text: opt.optionText,
          votes: opt.votes,
          sortOrder: opt.sortOrder,
        })),
        // Attach comments if you like
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

    // 1) Ensure the user exists (optional, but recommended)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2) Count total polls
    const totalPolls = await Poll.count({ where: { userId } });

    // 3) Count total votes
    const totalVotes = await Vote.count({ where: { userId } });

    // 4) Count followers & following
    const followers = await Follow.count({ where: { followingId: userId } });
    const following = await Follow.count({ where: { followerId: userId } });

    // 5) Return stats
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

