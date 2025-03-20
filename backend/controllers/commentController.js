// controllers/commentController.js
const { Comment, User } = require('../models');

// POST /api/comments
exports.createComment = async (req, res, next) => {
  try {
    const { pollId, userId, commentText } = req.body;
    const comment = await Comment.create({ pollId, userId, commentText });
    res.status(201).json({ message: 'Comment created', comment });
  } catch (error) {
    next(error);
  }
};

// PUT /api/comments/:id
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    await comment.update(req.body);
    res.status(200).json({ message: 'Comment updated', comment });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:id
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    await comment.destroy();
    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/comments/poll/:pollId
exports.getCommentsByPoll = async (req, res, next) => {
  try {
    const pollId = req.params.pollId;
    const comments = await Comment.findAll({
      where: { pollId },
      include: [
        {
          // must match Comment.belongsTo(User, { as: 'user' })
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'profilePicture', 'displayName'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};
