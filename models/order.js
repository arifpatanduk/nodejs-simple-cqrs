"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.hasMany(models.OrderItem, {
        foreignKey: "orderId",
        as: "orderItems",
      });

      // Many-to-many dengan Product melalui OrderItem
      Order.belongsToMany(models.Product, {
        through: models.OrderItem,
        foreignKey: "orderId",
        otherKey: "productId",
        as: "products",
      });
    }
  }
  Order.init(
    {
      totalAmount: DataTypes.FLOAT,
      status: {
        type: DataTypes.STRING,
        defaultValue: "PENDING",
      },
      shippingAddress: DataTypes.TEXT,
      paymentMethod: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Order",
    }
  );
  return Order;
};
