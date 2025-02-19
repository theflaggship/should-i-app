const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Each category should be unique (e.g., Travel, Politics, Food)
  },
}, {});

module.exports = Category;