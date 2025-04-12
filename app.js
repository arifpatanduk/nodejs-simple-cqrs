const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");

const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const orderRoutes = require("./routes/orders");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);

// DB Sync
sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced");
  app.listen(3000, () => console.log("Server running on port 3000"));
});
