const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PollAllowedUsers = sequelize.define('PollAllowedUsers', {
  pollId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
}, {
  timestamps: false
});

module.exports = PollAllowedUsers;