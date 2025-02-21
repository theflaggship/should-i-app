const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Protected endpoints for following/unfollowing
router.post('/', verifyToken, followController.followUser);
router.delete('/', verifyToken, followController.unfollowUser);
router.get('/:id/followers', verifyToken, followController.getFollowers);
router.get('/:id/following', verifyToken, followController.getFollowing);

module.exports = router;
