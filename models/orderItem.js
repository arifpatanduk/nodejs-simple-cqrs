const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quantity: DataTypes.INTEGER,
    price: DataTypes.FLOAT,
  },
  {
    timestamps: false,
  }
);

module.exports = OrderItem;
