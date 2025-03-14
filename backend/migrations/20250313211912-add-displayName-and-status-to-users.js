'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'displayName', {
      type: Sequelize.STRING,
      allowNull: true,  // or false if you want it required
    });
    await queryInterface.addColumn('Users', 'status', {
      type: Sequelize.TEXT,
      allowNull: true,  // or false if you want it required
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'displayName');
    await queryInterface.removeColumn('Users', 'status');
  }
};
