'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bookings', 'class', {
      type: Sequelize.STRING,
      allowNull: false,
      // defaultValue: 'Economy', // Optional default
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('bookings', 'class');
  },
};
