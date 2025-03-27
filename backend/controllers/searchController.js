const { Op } = require('sequelize');
const { Poll, PollOption, User, Comment, Vote } = require('../models');

exports.searchAll = async (req, res, next) => {
  try {
    const query = req.query.query?.trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const userId = req.user?.id;

    // 1️⃣ Search users
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.iLike]: `%${query}%` } },
          { displayName: { [Op.iLike]: `%${query}%` } },
          { personalSummary: { [Op.iLike]: `%${query}%` } },
        ],
      },
      attributes: ['id', 'username', 'displayName', 'profilePicture', 'personalSummary'],
    });

    // 2️⃣ Search polls by question
    const polls = await Poll.findAll({
      where: {
        isPrivate: false,
        [Op.or]: [
          { question: { [Op.iLike]: `%${query}%` } },
        ],
      },
      include: [
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'optionText', 'votes', 'sortOrder'],
          separate: true,
          order: [['sortOrder', 'ASC']],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'profilePicture'],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    // 3️⃣ Also search by matching options
    const matchingOptions = await PollOption.findAll({
      where: {
        optionText: { [Op.iLike]: `%${query}%` },
      },
      attributes: ['pollId'],
    });

    const pollIdsFromOptions = [...new Set(matchingOptions.map(o => o.pollId))];

    const extraPolls = await Poll.findAll({
      where: {
        id: { [Op.in]: pollIdsFromOptions },
        isPrivate: false,
      },
      include: [
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'optionText', 'votes', 'sortOrder'],
          separate: true,
          order: [['sortOrder', 'ASC']],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'profilePicture'],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id'],
        },
      ],
    });

    // Merge polls
    const combinedPollMap = new Map();
    [...polls, ...extraPolls].forEach(p => combinedPollMap.set(p.id, p));
    const uniquePolls = Array.from(combinedPollMap.values());

    // 4️⃣ Get logged-in user's votes for these polls
    let userVotesByPollId = {};
    if (userId) {
      const voteRecords = await Vote.findAll({
        where: { userId, pollId: uniquePolls.map(p => p.id) },
      });
      voteRecords.forEach(vote => {
        userVotesByPollId[vote.pollId] = vote.pollOptionId;
      });
    }

    // 5️⃣ Transform polls
    const finalPolls = uniquePolls.map(poll => {
      return {
        id: poll.id,
        question: poll.question,
        createdAt: poll.createdAt,
        isPrivate: poll.isPrivate,
        allowComments: poll.allowComments,
        commentCount: poll.comments?.length || 0,
        userVote: userVotesByPollId[poll.id] || null,
        user: poll.user
          ? {
              id: poll.user.id,
              username: poll.user.username,
              displayName: poll.user.displayName,
              profilePicture: poll.user.profilePicture,
            }
          : null,
        options: (poll.options || []).map(opt => ({
          id: opt.id,
          text: opt.optionText,
          votes: opt.votes,
          sortOrder: opt.sortOrder,
        })),
      };
    });

    return res.status(200).json({ users, polls: finalPolls });
  } catch (error) {
    next(error);
  }
};
