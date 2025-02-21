const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const PollOption = require('./PollOption');

module.exports = (sequelize, DataTypes) => {
  const Poll = sequelize.define('Poll', {
    question: { type: DataTypes.TEXT, allowNull: false },
    isPrivate: { type: DataTypes.BOOLEAN, defaultValue: false },
    allowComments: { type: DataTypes.BOOLEAN, defaultValue: true },
    expirationDate: { type: DataTypes.DATE },
    isImagePoll: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    timestamps: true
  });

  return Poll;
};
