const { Product, Category, sequelize } = require("../models");
const { writeOutbox } = require("../helpers/outbox");
const { v4: uuidv4 } = require("uuid");
const esClient = require("../config/elastic");
const { Op } = require("sequelize");

// CREATE product
async function createProduct(req, res) {
  const { name, description, price, stockQuantity, categoryId, images } =
    req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      const newProduct = await Product.create(
        {
          name,
          description,
          price,
          stockQuantity,
          categoryId,
          images,
        },
        { transaction: t }
      );

      // Fetch category details
      const category = await Category.findByPk(categoryId, { transaction: t });

      // Build payload with nested category data
      const payload = {
        ...newProduct.toJSON(),
        category: category
          ? {
              id: category.id,
              name: category.name,
              description: category.description,
            }
          : null,
      };

      await writeOutbox(
        {
          aggregatetype: "products",
          aggregateid: newProduct.id,
          type: "INSERT",
          payload,
        },
        t
      );

      return newProduct;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// UPDATE product
async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, description, price, stockQuantity, categoryId, images } =
    req.body;

  try {
    const result = await sequelize.transaction(async (t) => {
      const product = await Product.findByPk(id, { transaction: t });
      if (!product) throw new Error("Product not found");

      await product.update(
        {
          name,
          description,
          price,
          stockQuantity,
          categoryId,
          images,
        },
        { transaction: t }
      );

      // Fetch category details
      const category = await Category.findByPk(product.categoryId, {
        transaction: t,
      });

      // Build payload with nested category data
      const payload = {
        ...product.toJSON(),
        category: category
          ? {
              id: category.id,
              name: category.name,
              description: category.description,
            }
          : null,
      };

      await writeOutbox(
        {
          aggregatetype: "products",
          aggregateid: product.id,
          type: "UPDATE",
          payload,
        },
        t
      );

      return product;
    });

    res.json(result);
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
}

// DELETE product
async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    await sequelize.transaction(async (t) => {
      const product = await Product.findByPk(id, { transaction: t });
      if (!product) throw new Error("Product not found");

      await product.destroy({ transaction: t });

      await writeOutbox(
        {
          aggregatetype: "products",
          aggregateid: id,
          type: "DELETE",
          payload: null,
        },
        t
      );
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
}

// GET /api/products
async function getProducts(req, res) {
  try {
    const {
      page = 1,
      limit = 10000,
      sortBy = "createdAt",
      category,
      minPrice,
      maxPrice,
      search,
    } = req.query;
    const from = (page - 1) * limit;

    const filters = [];

    if (category) filters.push({ term: { categoryId: category } });
    if (minPrice)
      filters.push({ range: { price: { gte: parseFloat(minPrice) } } });
    if (maxPrice)
      filters.push({ range: { price: { lte: parseFloat(maxPrice) } } });

    const query = {
      bool: {
        must: search
          ? [
              {
                multi_match: {
                  query: search,
                  fields: ["name^2", "description"],
                },
              },
            ]
          : [{ match_all: {} }],
        filter: filters,
      },
    };

    const result = await esClient.search({
      index: "ecommerce.products",
      from,
      size: limit,
      sort: [{ [sortBy]: { order: "desc" } }],
      query,
    });

    const hits = result.hits.hits.map((hit) => hit._source);

    res.json({
      total: result.hits.total.value,
      page: Number(page),
      limit: Number(limit),
      data: hits,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
}

// GET /api/products/mysql
async function getProductsMysql(req, res) {
  try {
    const {
      page = 1,
      limit = 10000,
      sortBy = "createdAt",
      category,
      minPrice,
      maxPrice,
      search,
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (category) whereClause.categoryId = category;
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
    }
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      offset: Number(offset),
      limit: Number(limit),
      order: [[sortBy, "DESC"]],
      include: [
        {
          model: Category,
          as: "category", // <-- Add this line to match the alias in your association
          attributes: ["id", "name", "description"],
        },
      ],
    });

    res.json({
      total: count,
      page: Number(page),
      limit: Number(limit),
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const result = await esClient.get({ index: "ecommerce.products", id });

    res.json(result._source);
  } catch (err) {
    if (err.meta?.statusCode === 404) {
      res.status(404).json({ message: "Product not found" });
    } else {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  }
}

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductsMysql,
  getProductById,
};
