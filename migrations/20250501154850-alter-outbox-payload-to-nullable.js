"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Outbox", "payload", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment:
        "Payload of the outbox message, can be null for delete operations",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Outbox", "payload", {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {},
      comment: "Payload of the outbox message",
    });
  },
};
