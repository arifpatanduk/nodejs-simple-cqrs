const { Category } = require("../models");
const { writeOutbox } = require("../helpers/outbox");
const esClient = require("../config/elastic");

// POST /api/categories
async function createCategory(req, res) {
  try {
    const { name, description } = req.body;

    const newCategory = await Category.create({ name, description });

    await writeOutbox({
      aggregatetype: "category",
      aggregateid: newCategory.id,
      type: "CATEGORY_CREATED",
      payload: newCategory.toJSON(),
    });

    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// PUT /api/categories/:id
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByPk(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    await category.update({ name, description });

    await writeOutbox({
      aggregatetype: "category",
      aggregateid: category.id,
      type: "CATEGORY_UPDATED",
      payload: category.toJSON(),
    });

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/categories/:id
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    await category.destroy();

    await writeOutbox({
      aggregatetype: "category",
      aggregateid: id,
      type: "CATEGORY_DELETED",
      payload: { id },
    });

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getCategories(req, res) {
  try {
    const { body } = await esClient.search({
      index: "categories",
      query: { match_all: {} },
      size: 1000,
    });

    const categories = body.hits.hits.map((hit) => hit._source);
    res.json({ data: categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
}

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
};
