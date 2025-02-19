require('dotenv').config();  // This line loads the .env file
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'should_i_app',   // Should be "should_i_app"
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
  }
);

module.exports = sequelize;