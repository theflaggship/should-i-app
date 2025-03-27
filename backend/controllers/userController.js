// userController.js
const { Op } = require('sequelize');
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

    // 1) Parse pagination params
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    // 2) Find & count polls by userId
    const { rows: polls, count: totalCount } = await Poll.findAndCountAll({
      where: { userId },
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture', 'displayName'],
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
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'profilePicture', 'displayName'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // 3) If the requesting user is logged in, find their votes
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

    // 4) Transform each poll
    const data = polls.map((poll) => {
      const userVote = userVotesByPollId[poll.id] || null;
      const commentCount = poll.comments?.length || 0;

      return {
        id: poll.id,
        question: poll.question,
        createdAt: poll.createdAt,
        allowComments: poll.allowComments,
        isPrivate: poll.isPrivate,
        commentCount,
        userVote,
        user: poll.user
          ? {
              id: poll.user.id,
              username: poll.user.username,
              profilePicture: poll.user.profilePicture,
              displayName: poll.user.displayName,
            }
          : null,
        options: (poll.options || []).map((opt) => ({
          id: opt.id,
          text: opt.optionText,
          votes: opt.votes,
        })),
        comments: (poll.comments || []).map((c) => ({
          id: c.id,
          text: c.commentText,
          createdAt: c.createdAt,
          edited: c.edited,
          user: c.user
            ? {
                id: c.user.id,
                username: c.user.username,
                profilePicture: c.user.profilePicture,
              }
            : null,
        })),
      };
    });

    // 5) Return result with pagination metadata
    return res.status(200).json({
      totalCount,
      polls: data,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/comments - Retrieve all comments made by the user
exports.getUserComments = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    // 1) Find & count all comments by this user
    const { rows: comments, count: totalCount } = await Comment.findAndCountAll({
      where: { userId },
      limit,
      offset,
      include: [
        {
          model: Poll,
          as: 'poll',
          attributes: ['id', 'question', 'createdAt'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'profilePicture', 'displayName'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture', 'displayName'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // 2) Transform each comment
    const data = comments.map((comment) => {
      return {
        id: comment.id,
        text: comment.commentText,
        createdAt: comment.createdAt,
        edited: comment.edited,
        poll: comment.poll
          ? {
              id: comment.poll.id,
              question: comment.poll.question,
              createdAt: comment.poll.createdAt,
              user: comment.poll.user
                ? {
                    id: comment.poll.user.id,
                    username: comment.poll.user.username,
                    profilePicture: comment.poll.user.profilePicture,
                    displayName: comment.poll.user.displayName,
                  }
                : null,
            }
          : null,
        user: comment.user
          ? {
              id: comment.user.id,
              username: comment.user.username,
              profilePicture: comment.user.profilePicture,
              displayName: comment.user.displayName,
            }
          : null,
      };
    });

    return res.status(200).json({
      totalCount,
      comments: data,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/votes
exports.getUserVotes = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // 1) Parse pagination params
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    // 2) Find & count all votes by this user
    const { rows: votes, count: totalCount } = await Vote.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          // Must match Vote.belongsTo(PollOption, { as: 'pollOption' })
          model: PollOption,
          as: 'pollOption',
          attributes: ['id', 'optionText', 'votes', 'pollId', 'sortOrder'],
          include: [
            {
              // Must match PollOption.belongsTo(Poll, { as: 'poll' })
              model: Poll,
              as: 'poll',
              attributes: ['id', 'question', 'createdAt', 'allowComments', 'isPrivate'],
              include: [
                {
                  // Must match Poll.belongsTo(User, { as: 'user' })
                  model: User,
                  as: 'user',
                  attributes: ['id', 'username', 'profilePicture', 'displayName'],
                },
                {
                  // Must match Poll.hasMany(PollOption, { as: 'options' })
                  model: PollOption,
                  as: 'options',
                  attributes: ['id', 'optionText', 'votes', 'sortOrder'],
                },
                {
                  // Must match Poll.hasMany(Comment, { as: 'comments' })
                  model: Comment,
                  as: 'comments',
                  attributes: ['id', 'commentText', 'createdAt', 'edited'],
                  include: [
                    {
                      model: User,
                      as: 'user',
                      attributes: ['id', 'username', 'profilePicture', 'displayName'],
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
          attributes: ['id', 'username', 'profilePicture', 'displayName'],
        },
      ],
    });

    // 3) Transform each vote => poll object
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
        isPrivate: poll.isPrivate,
        commentCount: (poll.comments || []).length,
        userVote,
        user: poll.user
          ? {
              id: poll.user.id,
              username: poll.user.username,
              profilePicture: poll.user.profilePicture,
             displayName: poll.user.displayName,
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
          edited: c.edited,
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

    // 4) Return pagination metadata + data
    return res.status(200).json({
      totalCount,
      votes: results,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/suggested - Suggested users to follow
// ✅ Step 3: SUGGESTED USERS API

// In your userController.js (add at the bottom)
exports.getSuggestedUsers = async (req, res, next) => {
  try {
    const loggedInUserId = req.user.id;

    // 1) Get IDs the logged-in user already follows
    const currentFollows = await Follow.findAll({
      where: { followerId: loggedInUserId },
      attributes: ['followingId']
    });
    const followingIds = currentFollows.map(f => f.followingId);

    // 2) Get followers of the logged-in user
    const followersOfMe = await Follow.findAll({
      where: { followingId: loggedInUserId },
      attributes: ['followerId']
    });
    const followerIds = followersOfMe.map(f => f.followerId);

    // 3) From those followers, find who THEY follow (excluding the logged-in user)
    const extendedFollows = await Follow.findAll({
      where: {
        followerId: followerIds,
        followingId: { [Op.notIn]: [...followingIds, loggedInUserId] }
      },
      attributes: ['followingId']
    });
    const suggestedIds = [...new Set(extendedFollows.map(f => f.followingId))];

    // 4) Fetch User data for suggested IDs
    const suggestedUsers = await User.findAll({
      where: { id: suggestedIds },
      attributes: ['id', 'username', 'displayName', 'profilePicture', 'personalSummary']
    });

    // 5) Annotate with whether loggedInUser follows them (all will be false)
    const annotated = suggestedUsers.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      profilePicture: u.profilePicture,
      personalSummary: u.personalSummary,
      amIFollowing: false,
    }));

    res.status(200).json(annotated);
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
