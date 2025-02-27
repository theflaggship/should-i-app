const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    pollId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    commentText: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {});

  return Comment
}