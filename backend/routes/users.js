const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// const { getPresignedUrl, updateProfilePicture } = require('../controllers/uploadController');
const { verifyToken, checkSameUser } = require('../middlewares/authMiddleware');

// Protected endpoints for user profile and related data
router.get('/:id', verifyToken, userController.getUserProfile);
router.put('/:id', verifyToken, checkSameUser, userController.updateUserProfile);
router.get('/:id/polls', verifyToken, userController.getUserPolls);
router.get('/:id/votes', verifyToken, userController.getUserVotes);
router.get('/:id/comments', verifyToken, userController.getUserComments);
router.get('/:id/stats', verifyToken, userController.getUserStats);
// router.post('/users/upload-url', verifyToken, getPresignedUrl);
// router.put('/users/profile-picture', verifyToken, updateProfilePicture);


module.exports = router;
