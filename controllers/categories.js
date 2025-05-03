const { Category, sequelize } = require("../models");
const { writeOutbox } = require("../helpers/outbox");
const esClient = require("../config/elastic");

// POST /api/categories
async function createCategory(req, res) {
  const { name, description } = req.body;
  try {
    const result = await sequelize.transaction(async (t) => {
      const newCategory = await Category.create(
        { name, description },
        { transaction: t }
      );

      await writeOutbox(
        {
          aggregatetype: "categories",
          aggregateid: newCategory.id,
          type: "INSERT",
          payload: newCategory,
        },
        t
      );

      return newCategory;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Create Category Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// PUT /api/categories/:id
async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      const category = await Category.findByPk(id, { transaction: t });
      if (!category) throw new Error("Category not found");

      await category.update({ name, description }, { transaction: t });

      await writeOutbox(
        {
          aggregatetype: "categories",
          aggregateid: id,
          type: "UPDATE",
          payload: category,
        },
        t
      );

      return category;
    });

    res.json(result);
  } catch (error) {
    console.error("Update Category Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/categories/:id
async function deleteCategory(req, res) {
  const { id } = req.params;

  try {
    const result = await sequelize.transaction(async (t) => {
      const category = await Category.findByPk(id, { transaction: t });
      if (!category) throw new Error("Category not found");

      await category.destroy({ transaction: t });

      await writeOutbox(
        {
          aggregatetype: "categories",
          aggregateid: id,
          type: "DELETE",
          payload: null,
        },
        t
      );

      return category;
    });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete Category Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET categories from MySQL
async function getCategoriesMysql(req, res) {
  try {
    const { page = 1, limit = 1000 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Category.findAndCountAll({
      offset: Number(offset),
      limit: Number(limit),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      total: count,
      page: Number(page),
      limit: Number(limit),
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
}

// GET categories from Elasticsearch
async function getCategories(req, res) {
  try {
    const { page = 1, limit = 1000 } = req.query;
    const from = (page - 1) * limit;

    const result = await esClient.search({
      index: "ecommerce.categories",
      query: { match_all: {} },
      from,
      size: Number(limit),
    });

    const categories = result.hits.hits.map((hit) => hit._source);
    res.json({
      total: result.hits.total.value,
      page: Number(page),
      limit: Number(limit),
      data: categories,
    });
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
  getCategoriesMysql,
};
