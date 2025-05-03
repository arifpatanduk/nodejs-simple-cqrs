const { Order, OrderItem, Product, sequelize } = require("../models");
const { writeOutbox } = require("../helpers/outbox");
const esClient = require("../config/elastic");
const { Op } = require("sequelize"); // <-- Add this line

// POST /api/orders
async function createOrder(req, res) {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    const result = await sequelize.transaction(async (t) => {
      const order = await Order.create(
        { shippingAddress, paymentMethod },
        { transaction: t }
      );

      let totalAmount = 0;
      const createdItems = [];

      for (const item of items) {
        const product = await Product.findByPk(item.productId, {
          transaction: t,
        });
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const orderItem = await OrderItem.create(
          {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          },
          { transaction: t }
        );

        totalAmount += product.price * item.quantity;
        createdItems.push({
          productId: item.productId,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
        });
      }

      await order.update({ totalAmount }, { transaction: t });

      await writeOutbox({
        aggregatetype: "orders",
        aggregateid: order.id,
        type: "INSERT",
        payload: {
          id: order.id,
          items: createdItems,
          totalAmount,
          status: order.status,
          shippingAddress,
          paymentMethod,
          createdAt: order.createdAt,
        },
      });

      return {
        id: order.id,
        items: createdItems,
        totalAmount,
        shippingAddress,
        paymentMethod,
        status: order.status,
        createdAt: order.createdAt,
      };
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create order" });
  }
}

// PUT /api/orders/:id/status
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await sequelize.transaction(async (t) => {
      const order = await Order.findByPk(id, { transaction: t });
      if (!order) throw new Error("Order not found");

      await order.update({ status }, { transaction: t });

      await writeOutbox({
        aggregatetype: "orders",
        aggregateid: order.id,
        type: "UPDATE",
        payload: {
          id: order.id,
          status: order.status,
          updatedAt: order.updatedAt,
        },
      });

      return order;
    });

    res.json(result);
  } catch (err) {
    const msg = err.message === "Order not found" ? 404 : 500;
    res.status(msg).json({ message: err.message });
  }
}

// GET /api/orders
async function getOrders(req, res) {
  try {
    const { page = 1, limit = 10000, status } = req.query;
    const from = (page - 1) * limit;

    const filters = status ? [{ term: { status } }] : [];

    const result = await esClient.search({
      index: "ecommerce.orders",
      from,
      size: limit,
      query: {
        bool: {
          must: [{ match_all: {} }],
          filter: filters,
        },
      },
    });

    const orders = result.hits.hits.map((hit) => hit._source);

    res.json({
      total: result.hits.total.value,
      page: Number(page),
      limit: Number(limit),
      // data: orders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
}

// GET /api/orders/mysql
async function getOrdersMysql(req, res) {
  try {
    const { page = 1, limit = 10000, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;

    const { rows } = await Order.findAndCountAll({
      where: whereClause,
      offset: Number(offset),
      limit: Number(limit),
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "price"],
            },
          ],
        },
      ],
    });

    res.json({
      total: rows.length, // Only count the current page's data
      page: Number(page),
      limit: Number(limit),
      // data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
}

// GET /api/orders/:id
async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const { body } = await esClient.get({ index: "ecommerce.orders", id });

    res.json(body._source);
  } catch (err) {
    if (err.meta.statusCode === 404) {
      res.status(404).json({ message: "Order not found" });
    } else {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  }
}

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrders,
  getOrdersMysql,
  getOrderById,
};
