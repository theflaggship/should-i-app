const { Comment, User } = require('../models');

// POST /api/comments
exports.createComment = async (req, res, next) => {
  try {
    const { pollId, userId, commentText } = req.body;

    const comment = await Comment.create({
      pollId,
      userId,
      commentText,
      edited: false, // ensure default
    });

    // Re-fetch with user for consistency
    const fullComment = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'displayName', 'profilePicture'],
      }],
    });

    const normalized = {
      id: fullComment.id,
      text: fullComment.commentText,
      createdAt: fullComment.createdAt,
      edited: fullComment.edited,
      user: fullComment.user,
    };

    res.status(201).json({ message: 'Comment created', comment: normalized });
  } catch (error) {
    next(error);
  }
};

// PUT /api/comments/:id
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await comment.update({
      commentText: req.body.commentText,
      edited: true,
    });

    const updated = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'displayName', 'profilePicture'],
      }],
    });

    const normalized = {
      id: updated.id,
      text: updated.commentText,
      createdAt: updated.createdAt,
      edited: updated.edited,
      user: updated.user,
    };

    return res.status(200).json({ comment: normalized });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

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
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'displayName', 'profilePicture'],
      }],
      order: [['createdAt', 'ASC']],
    });

    const normalized = comments.map((c) => ({
      id: c.id,
      text: c.commentText,
      createdAt: c.createdAt,
      edited: c.edited,
      user: c.user,
    }));

    res.status(200).json(normalized);
  } catch (error) {
    next(error);
  }
};
