// src/routes/pollRoutes.js
const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  createPollValidation,
  updatePollValidation,
} = require('../validators/pollValidation');
const validate = require('../validators/validate');

// All endpoints are protected with verifyToken

// Create a new poll
router.post('/', verifyToken, createPollValidation, validate, pollController.createPoll);

// Retrieve all polls (public feed or main feed)
router.get('/', verifyToken, pollController.getAllPolls);

// Retrieve polls from users you follow
router.get('/following', verifyToken, pollController.getFollowingPolls);

// Retrieve a single poll by its ID
router.get('/:id', pollController.getPollById);

// Update a poll by its ID
router.put('/:id', verifyToken, updatePollValidation, validate, pollController.updatePoll);

// Delete a poll by its ID
router.delete('/:id', verifyToken, pollController.deletePoll);

module.exports = router;
