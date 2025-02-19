const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Follow = sequelize.define('Follow', {
  followerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  followingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
}, {
  timestamps: true // This will store when the follow happened
});

module.exports = Follow;