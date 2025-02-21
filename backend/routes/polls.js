const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { createPollValidation, updatePollValidation } = require('../validators/pollValidation');  // <-- Import here
const validate = require('../validators/validate');

// All endpoints are protected with verifyToken

// Create a new poll
router.post('/', verifyToken, createPollValidation, validate, pollController.createPoll);

// Retrieve all polls
router.get('/', pollController.getAllPolls);

// Retrieve a single poll by its ID
router.get('/:id', pollController.getPollById);

// Update a poll by its ID
router.put('/:id', verifyToken, updatePollValidation, validate, pollController.updatePoll);

// Delete a poll by its ID
router.delete('/:id', verifyToken, pollController.deletePoll);

module.exports = router;

