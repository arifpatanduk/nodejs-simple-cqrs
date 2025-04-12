const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categories");

router.post("/", categoryController.createCategory);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

router.get("/", categoryController.getCategories);

module.exports = router;
