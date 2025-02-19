const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protected endpoints for voting actions
router.post('/', verifyToken, voteController.castVote);
router.delete('/', verifyToken, voteController.removeVote);

module.exports = router;
