const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Poll = sequelize.define('Poll', {
  question: { type: DataTypes.TEXT, allowNull: false },
  isPrivate: { type: DataTypes.BOOLEAN, defaultValue: false },
  allowComments: { type: DataTypes.BOOLEAN, defaultValue: true },
  expirationDate: { type: DataTypes.DATE },
  isImagePoll: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {});

module.exports = Poll;