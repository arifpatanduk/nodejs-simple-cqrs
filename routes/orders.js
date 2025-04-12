const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders");

router.post("/", orderController.createOrder);
router.put("/:id/status", orderController.updateOrderStatus);

router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrderById);

module.exports = router;
