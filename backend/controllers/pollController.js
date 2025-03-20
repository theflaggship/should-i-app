// controllers/pollController.js
const { Poll, User, PollOption, Comment, Vote, Follow } = require('../models');
const { Op } = require('sequelize');

// POST /api/polls
exports.createPoll = async (req, res, next) => {
  try {
    const pollData = req.body;
    const newPoll = await Poll.create(pollData);

    // If poll options are provided, create them
    if (Array.isArray(req.body.options)) {
      const pollOptions = req.body.options.map((option, index) => ({
        pollId: newPoll.id,
        optionText: option.optionText,
        optionImage: option.optionImage || null,
        sortOrder: index,
      }));
      await PollOption.bulkCreate(pollOptions);
    }

    const pollWithUserAndOptions = await Poll.findOne({
      where: { id: newPoll.id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'profilePicture', 'displayName'], },
        { model: PollOption, as: 'options' },
      ],
    });

    res.status(201).json({
      message: 'Poll created successfully',
      poll: pollWithUserAndOptions,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/polls - Retrieve all polls
exports.getAllPolls = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    // 1) Parse pagination params
    //    You can do "limit & offset" or "page & limit"
    const limit = parseInt(req.query.limit, 10) || 10;   // default limit=10
    const offset = parseInt(req.query.offset, 10) || 0;  // default offset=0

    // 2) Find & count all polls that are NOT private
    const { rows: polls, count: totalCount } = await Poll.findAndCountAll({
      where: {
        isPrivate: false,  // only public polls
      },
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

    // 3) If user is logged in, find all of their votes for these poll IDs
    let userVotesByPollId = {};
    if (userId) {
      const pollIds = polls.map((p) => p.id);
      const userVotes = await Vote.findAll({
        where: { userId, pollId: pollIds },
      });
      userVotes.forEach((vote) => {
        userVotesByPollId[vote.pollId] = vote.pollOptionId;
      });
    }

    // 4) Transform each poll
    const data = polls.map((poll) => {
      const userVote = userVotesByPollId[poll.id] || null;
      return {
        id: poll.id,
        question: poll.question,
        createdAt: poll.createdAt,
        allowComments: poll.allowComments,
        isPrivate: poll.isPrivate, // should be false here
        commentCount: poll.comments?.length || 0,
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

    // 5) Return polls plus meta info
    return res.status(200).json({
      totalCount,  // how many total (non-private) polls exist
      polls: data, // the current page/slice
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/polls/following - Retrieve polls from users you follow
exports.getFollowingPolls = async (req, res, next) => {
  try {
    const requestingUserId = req.user?.id;
    if (!requestingUserId) {
      return res.status(401).json({ error: 'You must be logged in to view following polls.' });
    }

    // 1) Parse pagination params
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    // 2) Find the user IDs that this user is following
    const follows = await Follow.findAll({
      where: { followerId: requestingUserId },
      attributes: ['followingId'],
    });
    const followingIds = follows.map((f) => f.followingId);

    if (!followingIds.length) {
      // If not following anyone, just return an empty array
      return res.status(200).json({
        totalCount: 0,
        polls: [],
      });
    }

    // 3) Find & count polls created by these followed users
    //    (no isPrivate filter here, so we see *all* of their polls)
    const { rows: polls, count: totalCount } = await Poll.findAndCountAll({
      where: { userId: followingIds },
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

    // 4) If user is logged in, find all votes for these poll IDs
    let userVotesByPollId = {};
    const pollIds = polls.map((p) => p.id);
    const userVotes = await Vote.findAll({
      where: { userId: requestingUserId, pollId: pollIds },
    });
    userVotes.forEach((vote) => {
      userVotesByPollId[vote.pollId] = vote.pollOptionId;
    });

    // 5) Transform results
    const data = polls.map((poll) => {
      const userVote = userVotesByPollId[poll.id] || null;
      return {
        id: poll.id,
        question: poll.question,
        createdAt: poll.createdAt,
        allowComments: poll.allowComments,
        isPrivate: poll.isPrivate,
        commentCount: poll.comments?.length || 0,
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

    return res.status(200).json({
      totalCount,
      polls: data,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/polls/:id
exports.getPollById = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const pollId = req.params.id;

    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture', 'displayName'],
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'optionText', 'votes'],
          separate: true,
          order: [['sortOrder', 'ASC']],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id', 'commentText', 'createdAt', 'userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'profilePicture', 'displayName'],
            },
          ],
        },
      ],
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    let userVote = null;
    if (userId) {
      const existingVote = await Vote.findOne({
        where: { userId, pollId: poll.id },
      });
      if (existingVote) {
        userVote = existingVote.pollOptionId;
      }
    }

    res.status(200).json({
      id: poll.id,
      question: poll.question,
      createdAt: poll.createdAt,
      allowComments: poll.allowComments,
      commentCount: poll.comments?.length || 0,
      user: poll.user
        ? {
            id: poll.user.id,
            username: poll.user.username,
            profilePicture: poll.user.profilePicture,
            displayName: poll.user.displayName,
          }
        : null,
      userVote,
      isPrivate: poll.isPrivate, 
      options: (poll.options || []).map((opt) => ({
        id: opt.id,
        text: opt.optionText,
        votes: opt.votes,
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
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/polls/:id
exports.updatePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    await poll.update({
      question: req.body.question,
      allowComments: req.body.allowComments,
      isPrivate: req.body.isPrivate,
      // any other Poll columns...
    });

    if (Array.isArray(req.body.options)) {
      // Remove existing options
      await PollOption.destroy({ where: { pollId: poll.id } });
      const newOptions = req.body.options.map((opt, index) => ({
        pollId: poll.id,
        optionText: opt.optionText,
        optionImage: opt.optionImage || null,
        sortOrder: index,
      }));
      await PollOption.bulkCreate(newOptions);
    }

    const updatedPoll = await Poll.findOne({
      where: { id: poll.id },
      include: [{ model: PollOption, as: 'options' }],
    });

    res.status(200).json({
      message: 'Poll updated successfully',
      poll: updatedPoll,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/polls/:id
exports.deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    await poll.destroy();
    res.status(200).json({ message: 'Poll deleted successfully' });
  } catch (error) {
    next(error);
  }
};
