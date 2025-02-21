const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteControllers');
const { verifyToken } = require('../middlewares/authMiddleware');

// Protected endpoints for voting actions
router.post('/', verifyToken, voteController.castVote);
router.delete('/', verifyToken, voteController.removeVote);

module.exports = router;
