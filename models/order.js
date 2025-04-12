const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    totalAmount: DataTypes.FLOAT,
    status: {
      type: DataTypes.STRING,
      defaultValue: "PENDING",
    },
    shippingAddress: DataTypes.TEXT,
    paymentMethod: DataTypes.STRING,
  },
  {
    timestamps: true,
  }
);

module.exports = Order;
