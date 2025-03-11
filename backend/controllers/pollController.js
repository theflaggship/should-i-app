// controllers/pollController.js
const { Poll, User, PollOption, Comment, Vote } = require('../models');

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
        { model: User, as: 'user', attributes: ['id', 'username'] },
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

    const polls = await Poll.findAll({
      include: [
        {
          model: User,
          as: 'user', // must match Poll.belongsTo(User, { as: 'user' })
          attributes: ['id', 'username', 'profilePicture'],
        },
        {
          model: PollOption,
          as: 'options', // must match Poll.hasMany(PollOption, { as: 'options' })
          attributes: ['id', 'optionText', 'votes', 'sortOrder'],
          separate: true,
          order: [['sortOrder', 'ASC']],
        },
        {
          model: Comment,
          as: 'comments', // must match Poll.hasMany(Comment, { as: 'comments' })
          attributes: ['id', 'commentText', 'createdAt'],
          include: [
            {
              // must match Comment.belongsTo(User, { as: 'user' })
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'profilePicture'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // If user is logged in, find all votes for these poll IDs
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

    // Transform
    const data = polls.map((poll) => {
      const userVote = userVotesByPollId[poll.id] || null;
      return {
        id: poll.id,
        question: poll.question,
        createdAt: poll.createdAt,
        allowComments: poll.allowComments,
        commentCount: poll.comments?.length || 0,
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

    res.status(200).json(data);
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
          attributes: ['id', 'username', 'profilePicture'],
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
              attributes: ['id', 'username', 'profilePicture'],
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
          }
        : null,
      userVote,
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
