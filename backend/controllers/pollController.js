const { Poll, User, PollOption, Comment, Vote } = require('../models');

// POST /api/polls - Create a new poll
exports.createPoll = async (req, res, next) => {
  try {
    const pollData = req.body
    const newPoll = await Poll.create(pollData);

    // If poll options are provided, create them
    if (req.body.options && Array.isArray(req.body.options)) {
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
        {
          model: PollOption,
          as: 'options',
        },
      ],
    });

    res.status(201).json({ message: 'Poll created successfully', poll: pollWithUserAndOptions });
  } catch (error) {
    next(error);
  }
};

// GET /api/polls - Retrieve all polls with comment count
exports.getAllPolls = async (req, res, next) => {
  try {
    // 1) Identify user
    const userId = req.user?.id;

    // 2) Fetch all polls (no changes here)
    const polls = await Poll.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'optionText', 'votes', 'sortOrder'],
          separate: true,           // If you have multiple includes, 'separate' helps keep the sub-order
          order: [['sortOrder', 'ASC']],
        },
        {
          model: Comment,
          attributes: ['id', 'commentText', 'createdAt'],
          include: [
            { model: User, attributes: ['id', 'username', 'profilePicture'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 3) If user is logged in, fetch all votes for these poll IDs in one go
    let userVotesByPollId = {};
    if (userId) {
      const pollIds = polls.map((poll) => poll.id);
      const userVotes = await Vote.findAll({
        where: {
          userId,
          pollId: pollIds,
        },
        // attributes: ['pollId', 'pollOptionId'] if you only need those
      });

      // Build a quick lookup object
      userVotes.forEach((vote) => {
        userVotesByPollId[vote.pollId] = vote.pollOptionId;
      });
    }

    // 4) Transform polls + attach userVote
    const data = polls.map((poll) => {
      const userVote = userVotesByPollId[poll.id] || null;

      return {
        id: poll.id,
        question: poll.question,
        createdAt: poll.createdAt,
        allowComments: poll.allowComments,
        commentCount: poll.Comments?.length || 0,
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
        comments: poll.Comments.map((c) => ({
          id: c.id,
          text: c.commentText,
          createdAt: c.createdAt,
          User: c.User
            ? {
              id: c.User.id,
              username: c.User.username,
              profilePicture: c.User.profilePicture,
            }
            : null,
        })),
      };
    });

    // 5) Send the array of polls
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/polls/:id - Retrieve a specific poll by ID including comments
// GET /api/polls/:id - Retrieve a specific poll by ID including comments
exports.getPollById = async (req, res, next) => {
  try {
    const userId = req.user.id; // or req.query.userId
    const pollId = req.params.id;

    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'optionText', 'votes'],
          separate: true,           // If you have multiple includes, 'separate' helps keep the sub-order
          order: [['sortOrder', 'ASC']],
        },
        {
          model: Comment,
          attributes: ['id', 'commentText', 'createdAt', 'userId'], // Include createdAt so you can see it
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'profilePicture']
            }
          ]
        }
      ]
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
        userVote = existingVote.pollOptionId; // the ID of the voted option
      }
    }

    // Construct the response
    res.status(200).json({
      id: poll.id,
      question: poll.question,
      createdAt: poll.createdAt,
      allowComments: poll.allowComments,
      commentCount: poll.Comments?.length || 0,
      user: poll.User
        ? {
          username: poll.User.username,
          profilePicture: poll.User.profilePicture,
        }
        : null,
      userVote,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.optionText, // rename so the frontend sees "text"
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
      }))
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/polls/:id - Update a poll by ID
exports.updatePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      const err = new Error('Poll not found');
      err.status = 404;
      return next(err);
    }

    // 1) Update the Poll fields (question, allowComments, isPrivate, etc.)
    await poll.update({
      question: req.body.question,
      allowComments: req.body.allowComments,
      isPrivate: req.body.isPrivate,
      // any other Poll columns
    });

    // 2) If options are provided, replace old PollOptions
    if (Array.isArray(req.body.options)) {
      // Remove old options for this poll
      await PollOption.destroy({ where: { pollId: poll.id } });

      // Insert new options
      const newOptions = req.body.options.map((opt, index) => ({
        pollId: poll.id,
        optionText: opt.optionText,
        optionImage: opt.optionImage || null,
        sortOrder: index,
      }));
      await PollOption.bulkCreate(newOptions);
    }

    // 3) Re-query to include the updated poll with its new options
    const updatedPoll = await Poll.findOne({
      where: { id: poll.id },
      include: [{ model: PollOption, as: 'options' }], // match your association alias
    });

    res.status(200).json({
      message: 'Poll updated successfully',
      poll: updatedPoll,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/polls/:id - Delete a poll by ID
exports.deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      const err = new Error('Poll not found');
      err.status = 404;
      return next(err);
    }
    await poll.destroy();
    res.status(200).json({ message: 'Poll deleted successfully' });
  } catch (error) {
    next(error);
  }
};
