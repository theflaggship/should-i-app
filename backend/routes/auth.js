const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../validators/authValidation');
const validate = require('../validators/validate');

// Public endpoints (no token required)
router.post('/signup', signupValidation, validate, authController.signup);
router.post('/login', loginValidation, validate, authController.login);

module.exports = router;
