const { Poll, User, PollOption, Comment, Vote } = require('../models');
const { sequelize } = require('../models');

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
        { model: User, attributes: ['id', 'username'] },
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
    // 1) Identify the requesting user (JWT or query param)
    const userId = req.user?.id; // or req.query.userId

    // 2) Fetch polls with associated data
    const polls = await Poll.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'optionText', 'votes', 'sortOrder']
        },
        {
          model: Comment,
          attributes: ['id', 'commentText', 'createdAt'],
          include: [{ model: User, attributes: ['id', 'username', 'profilePicture'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 3) For each poll, find the user's vote (if userId is provided)
    const data = await Promise.all(
      polls.map(async (poll) => {
        let userVote = null;
        if (userId) {
          const existingVote = await Vote.findOne({
            where: { userId, pollId: poll.id },
          });
          if (existingVote) {
            userVote = existingVote.pollOptionId; // The ID of the option the user voted for
          }
        }

        // 4) Transform poll into final JSON, attaching userVote
        return {
          id: poll.id,
          question: poll.question,
          createdAt: poll.createdAt,
          allowComments: poll.allowComments,
          commentCount: poll.Comments?.length || 0,
          userVote,
          user: poll.User
            ? {
                id: poll.User.id,
                username: poll.User.username,
                profilePicture: poll.User.profilePicture,
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
                  profilePicture: c.User.profilePicture
                }
              : null
          }))
        };
      })
    );

    // 5) Send the array of polls (with userVote) as JSON
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
          attributes: ['id', 'username', 'profilePicture']
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'optionText', 'votes'],
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
