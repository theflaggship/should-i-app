// config/database.js
require('dotenv').config(); // Loads .env variables

module.exports = {
  username: process.env.DB_USER || 'should_i_admin',
  password: process.env.DB_PASS || '4options1vote',
  database: process.env.DB_NAME || 'should_i_app',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: process.env.DB_DIALECT || 'postgres'
};
