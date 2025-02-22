const { Poll, User, PollOption, Comment } = require('../models');
const { sequelize } = require('../models');

// POST /api/polls - Create a new poll
exports.createPoll = async (req, res, next) => {
  try {
    const pollData = req.body;
    const newPoll = await Poll.create(pollData);
    
    // If poll options are provided, create them
    if (req.body.options && Array.isArray(req.body.options)) {
      const pollOptions = req.body.options.map(option => ({
        pollId: newPoll.id,
        optionText: option.optionText,
        optionImage: option.optionImage || null,
      }));
      await PollOption.bulkCreate(pollOptions);
    }
    res.status(201).json({ message: 'Poll created successfully', poll: newPoll });
  } catch (error) {
    next(error);
  }
};

// GET /api/polls - Retrieve all polls with comment count
exports.getAllPolls = async (req, res, next) => {
  try {
    const polls = await Poll.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: PollOption,
          attributes: ['id', 'optionText', 'votes']
        },
        {
          model: Comment,
          attributes: ['id', 'commentText', 'userId'],
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const data = polls.map((poll) => ({
      id: poll.id,
      question: poll.question,
      createdAt: poll.createdAt,
      allowComments: poll.allowComments, 
      commentCount: poll.Comments?.length || 0,
      user: {
        username: poll.User?.username || 'Unknown',
        profilePicture: poll.User?.profilePicture || null
      },
      options: poll.PollOptions?.map((opt) => ({
        id: opt.id,
        text: opt.optionText,
        votes: opt.votes || 0
      })) || []
    }));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/polls/:id - Retrieve a specific poll by ID including comments
exports.getPollById = async (req, res, next) => {
  try {
    const poll = await Poll.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: PollOption,
          attributes: ['id', 'optionText', 'votes']
        },
        {
          model: Comment,
          attributes: ['id', 'commentText', 'userId'],
          include: {
            model: User,
            attributes: ['username', 'profilePicture'] // ✅ Include user info for comments
          }
        }
      ]
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.status(200).json({
      id: poll.id,
      question: poll.question,
      createdAt: poll.createdAt,
      allowComments: poll.allowComments,
      commentCount: poll.Comments?.length || 0,
      comments: poll.Comments?.map((comment) => ({
        id: comment.id,
        text: comment.commentText,
        user: {
          username: comment.User?.username || 'Unknown',
          profilePicture: comment.User?.profilePicture || null
        }
      })) || [],
      user: {
        username: poll.User?.username || 'Unknown',
        profilePicture: poll.User?.profilePicture || null
      },
      options: poll.PollOptions?.map((opt) => ({
        id: opt.id,
        text: opt.optionText,
        votes: opt.votes || 0
      })) || []
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
    await poll.update(req.body);
    res.status(200).json({ message: 'Poll updated successfully', poll });
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
