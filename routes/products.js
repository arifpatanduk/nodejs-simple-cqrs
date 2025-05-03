const express = require("express");
const router = express.Router();
const productController = require("../controllers/products");

router.post("/", productController.createProduct);
router.get("/", productController.getProducts);
router.get("/mysql", productController.getProductsMysql);

router.get("/:id", productController.getProductById);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
