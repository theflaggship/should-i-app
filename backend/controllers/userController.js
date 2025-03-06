// userController.js
const { User, Poll, Vote, Comment, PollOption } = require('../models');

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
    const userId = parseInt(req.params.id, 10);      // The profile owner
    const requestingUserId = req.user?.id;          // The logged-in user from the token

    // 1) Fetch all polls from this user
    const polls = await Poll.findAll({
      where: { userId }, // only polls belonging to userId
      include: [
        {
          // Attach the poll owner's user data
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture'],
        },
        {
          // Attach poll options
          model: PollOption,
          as: 'options',
          attributes: ['id', 'optionText', 'votes', 'sortOrder'],
          separate: true,
          order: [['sortOrder', 'ASC']],
        },
        {
          // Attach comments (so we can get commentCount)
          model: Comment,
          attributes: ['id', 'commentText', 'createdAt'],
          include: [
            { model: User, attributes: ['id', 'username', 'profilePicture'] }
          ]
        },
      ],
      order: [['createdAt', 'DESC']], // newest poll first
    });

    // 2) If there's a logged-in user, find their votes for these poll IDs
    let userVotesByPollId = {};
    if (requestingUserId) {
      const pollIds = polls.map((poll) => poll.id);
      const userVotes = await Vote.findAll({
        where: {
          userId: requestingUserId,
          pollId: pollIds,
        },
      });
      // Build a quick lookup object: pollId -> pollOptionId
      userVotes.forEach((vote) => {
        userVotesByPollId[vote.pollId] = vote.pollOptionId;
      });
    }

    // 3) Transform polls + attach userVote + commentCount
    const data = polls.map((poll) => {
      const userVote = userVotesByPollId[poll.id] || null;
      const commentCount = poll.Comments?.length || 0;

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
        comments: (poll.Comments || []).map((c) => ({
          id: c.id,
          text: c.commentText,
          createdAt: c.createdAt,
          User: c.User
            ? {
              id: c.User.id,
              username: c.User.username,
              profilePicture: c.User.profilePicture
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
exports.getUserVotes = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const votes = await Vote.findAll({
      where: { userId },
      // We include the poll option, which itself includes the poll
      include: [
        {
          model: PollOption,
          as: 'option',
          attributes: ['id', 'optionText'],
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
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(votes);
  } catch (error) {
    next(error);
  }
};
