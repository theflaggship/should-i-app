// validators/authValidation.js
const { check } = require('express-validator');

exports.signupValidation = [
  check('username')
    .notEmpty().withMessage('Username is required'),
  check('email')
    .isEmail().withMessage('A valid email is required'),
  check('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

exports.loginValidation = [
  check('username')
    .notEmpty().withMessage('Username is required'),
  check('password')
    .notEmpty().withMessage('Password is required'),
];
