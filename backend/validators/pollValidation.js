// validators/pollValidation.js
const { check } = require('express-validator');

exports.createPollValidation = [
  check('userId')
    .notEmpty().withMessage('User ID is required'),
  check('question')
    .notEmpty().withMessage('Poll question is required'),
  check('isPrivate')
    .isBoolean().withMessage('isPrivate must be a boolean'),
  check('allowComments')
    .isBoolean().withMessage('allowComments must be a boolean'),
  check('expirationDate')
    .optional().isISO8601().withMessage('Expiration date must be a valid ISO8601 date'),
  check('isImagePoll')
    .optional()  // if you want to treat it as false by default
    .isBoolean().withMessage('isImagePoll must be a boolean'),
  // If options are provided, they should be an array and each option must have text.
  check('options')
    .optional().isArray().withMessage('Options must be an array'),
  check('options.*.optionText')
    .optional().notEmpty().withMessage('Each option must have text'),
];

exports.updatePollValidation = [
  check('question')
    .optional().notEmpty().withMessage('Poll question cannot be empty'),
  check('isPrivate')
    .optional().isBoolean().withMessage('isPrivate must be a boolean'),
  check('allowComments')
    .optional().isBoolean().withMessage('allowComments must be a boolean'),
  check('expirationDate')
    .optional().isISO8601().withMessage('Expiration date must be a valid ISO8601 date'),
  check('isImagePoll')
    .optional().isBoolean().withMessage('isImagePoll must be a boolean'),
];
