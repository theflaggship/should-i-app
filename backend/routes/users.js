const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkSameUser } = require('../middlewares/authMiddleware');

// Protected endpoints for user profile and related data
router.get('/:id', verifyToken, checkSameUser, userController.getUserProfile);
router.put('/:id', verifyToken, checkSameUser, userController.updateUserProfile);
router.get('/:id/polls', verifyToken, checkSameUser, userController.getUserPolls);
router.get('/:id/votes', verifyToken, checkSameUser, userController.getUserVotes);
router.get('/:id/comments', verifyToken, checkSameUser, userController.getUserComments);
router.get('/:id/stats', verifyToken, checkSameUser, userController.getUserStats);

module.exports = router;
