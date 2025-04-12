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
          aggregatetype: "category",
          aggregateid: newCategory.id,
          type: "CATEGORY_CREATED",
          payload: newCategory.toJSON(),
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
          aggregatetype: "category",
          aggregateid: id,
          type: "CATEGORY_UPDATED",
          payload: category.toJSON(),
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
          aggregatetype: "category",
          aggregateid: id,
          type: "CATEGORY_DELETED",
          payload: { id },
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
