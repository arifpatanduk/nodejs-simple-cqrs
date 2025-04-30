"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Relasi one-to-many dengan Category
      Product.belongsTo(models.Category, {
        foreignKey: "categoryId",
        as: "category",
      });

      // Relasi many-to-many dengan Order melalui OrderItem
      Product.hasMany(models.OrderItem, {
        foreignKey: "productId",
        as: "orderItems",
      });

      Product.belongsToMany(models.Order, {
        through: models.OrderItem,
        foreignKey: "productId",
        otherKey: "orderId",
        as: "orders",
      });
    }
  }
  Product.init(
    {
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Categories",
          key: "id",
        },
      },
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      price: DataTypes.FLOAT,
      stockQuantity: DataTypes.INTEGER,
      images: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: "Product",
    }
  );
  return Product;
};
