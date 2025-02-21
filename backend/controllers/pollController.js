const { Poll, User, PollOption } = require('../models');

// POST /api/polls - Create a new poll
exports.createPoll = async (req, res, next) => {
  try {
    // Create the poll record using data from the request body
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

// GET /api/polls - Retrieve all polls
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
          attributes: ['id', 'optionText']
        }
      ]
    });

    const data = polls.map((poll) => ({
      id: poll.id,
      question: poll.question,
      // If poll.User is missing, fallback to "Unknown"
      user: {
        username: poll.User?.username || 'Unknown',
        profilePicture: poll.User?.profilePicture || null
      },
      // Convert poll.PollOptions to { id, text } array
      options: poll.PollOptions?.map((opt) => ({
        id: opt.id,
        text: opt.optionText
      })) || []
    }));


    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// GET /api/polls/:id - Retrieve a specific poll by ID
exports.getPollById = async (req, res, next) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      const err = new Error('Poll not found');
      err.status = 404;
      return next(err);
    }
    res.status(200).json(poll);
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
