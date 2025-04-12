const sequelize = require("../config/database");
const Product = require("./product");
const Category = require("./category");
const Order = require("./order");
const OrderItem = require("./orderItem");
const Outbox = require("./outbox");

// Associations
Category.hasMany(Product);
Product.belongsTo(Category);

Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);

Product.hasMany(OrderItem);
OrderItem.belongsTo(Product);

module.exports = {
  sequelize,
  Product,
  Category,
  Order,
  OrderItem,
  Outbox,
};
