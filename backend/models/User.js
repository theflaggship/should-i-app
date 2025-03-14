const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Poll = require('./Poll');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    profilePicture: { type: DataTypes.STRING },
    personalSummary: { type: DataTypes.TEXT },
    displayName: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.TEXT, allowNull: true },
  }, {});

  return User;
};