const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  }, {
    // Additional model options can go here
  });
  
  module.exports = PollOption;