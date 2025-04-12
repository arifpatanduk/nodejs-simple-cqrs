const { Product, Category } = require("../models");
const { writeOutbox } = require("../helpers/outbox");
const { v4: uuidv4 } = require("uuid");
const esClient = require("../config/elastic");

// CREATE product
async function createProduct(req, res) {
  try {
    const { name, description, price, stockQuantity, categoryId, images } =
      req.body;

    const newProduct = await Product.create({
      name,
      description,
      price,
      stockQuantity,
      categoryId,
      images,
    });

    // Outbox Event
    await writeOutbox({
      aggregatetype: "product",
      aggregateid: newProduct.id,
      type: "PRODUCT_CREATED",
      payload: newProduct.toJSON(),
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/products
async function getProducts(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
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

    const { body } = await esClient.search({
      index: "products",
      from,
      size: limit,
      sort: [`${sortBy}:desc`],
      query,
    });

    const hits = body.hits.hits.map((hit) => hit._source);

    res.json({
      total: body.hits.total.value,
      page: Number(page),
      limit: Number(limit),
      data: hits,
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
    const { body } = await esClient.get({ index: "products", id });

    res.json(body._source);
  } catch (err) {
    if (err.meta.statusCode === 404) {
      res.status(404).json({ message: "Product not found" });
    } else {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
};
