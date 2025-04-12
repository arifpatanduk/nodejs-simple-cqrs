const express = require("express");
const router = express.Router();
const productController = require("../controllers/products");

router.post("/", productController.createProduct);
router.get("/", productController.getProducts);

router.get("/:id", productController.getProductById);

module.exports = router;
