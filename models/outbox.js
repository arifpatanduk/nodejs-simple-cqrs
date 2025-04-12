const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Outbox = sequelize.define(
  "Outbox",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
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
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Outbox;
