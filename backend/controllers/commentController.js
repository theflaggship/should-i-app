const { Comment } = require('../models');

// POST /api/comments - Create a new comment
exports.createComment = async (req, res, next) => {
  try {
    const { pollId, userId, commentText } = req.body;
    const comment = await Comment.create({ pollId, userId, commentText });
    res.status(201).json({ message: 'Comment created', comment });
  } catch (error) {
    next(error);
  }
};

// PUT /api/comments/:id - Update a comment
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      const err = new Error('Comment not found');
      err.status = 404;
      return next(err);
    }
    await comment.update(req.body);
    res.status(200).json({ message: 'Comment updated', comment });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:id - Delete a comment
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      const err = new Error('Comment not found');
      err.status = 404;
      return next(err);
    }
    await comment.destroy();
    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/comments/poll/:pollId - Get all comments for a poll
exports.getCommentsByPoll = async (req, res, next) => {
  try {
    const comments = await Comment.findAll({
      where: { pollId: req.params.pollId },
      include: {
        model: User,
        attributes: ['username', 'profilePicture']
      },
      order: [['createdAt', 'ASC']]
    });
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};
