"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Outbox extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Outbox.init(
    {
      aggregatetype: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      aggregateid: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Outbox",
      tableName: "Outbox",
      freezeTableName: true,
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: false,
    }
  );
  return Outbox;
};
