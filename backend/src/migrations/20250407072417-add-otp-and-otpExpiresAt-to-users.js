'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'otp', {
      type: Sequelize.STRING,
      allowNull: true, // OTP field is nullable initially
    });

    await queryInterface.addColumn('users', 'otpExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true, // OTP expiration field is nullable initially
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'otp');
    await queryInterface.removeColumn('users', 'otpExpiresAt');
  }
};
