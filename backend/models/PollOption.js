const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Poll = require('./Poll');

module.exports = (sequelize, DataTypes) => {
const PollOption = sequelize.define('PollOption', {
    pollId: {
      type: DataTypes.INTEGER,
      allowNull: false, // This will be set when associating with a Poll
    },
    optionText: {
      type: DataTypes.STRING,
      allowNull: true, // Optional if you are using images
    },
    optionImage: {
      type: DataTypes.STRING,
      allowNull: true, // URL for the image option, if applicable
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    votes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // Ensure default is set to 0
    }
  }, {
    // Additional model options can go here
  });
  
    return PollOption;
  };
