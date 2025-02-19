const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vote = sequelize.define('Vote', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  pollId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  pollOptionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'pollId']  // Ensures one vote per user per poll
    }
  ]
});

module.exports = Vote;