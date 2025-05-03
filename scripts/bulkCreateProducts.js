const axios = require("axios");
const { faker } = require("@faker-js/faker");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function bulkCreateProducts() {
  const endpoint = "http://localhost:3000/api/products";
  const categoryIds = [3, 4, 5];
  const BATCH_SIZE = 2; // Lower batch size to reduce DB load
  const TOTAL = 10;

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    const requests = [];
    for (let j = 0; j < BATCH_SIZE && i + j < TOTAL; j++) {
      const product = {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
        stockQuantity: faker.number.int({ min: 1, max: 100 }),
        categoryId: categoryIds[Math.floor(Math.random() * categoryIds.length)],
        images: [faker.image.url()],
      };

      requests.push(
        axios.post(endpoint, product).catch((err) => {
          console.error(
            `Error on product #${i + j + 1}:`,
            err.response?.data || err.message
          );
        })
      );
    }

    await Promise.all(requests);
    await sleep(200); // Add delay between batches (adjust as needed)
    console.log(
      `Created products: ${Math.min(i + BATCH_SIZE, TOTAL)}/${TOTAL}`
    );
  }

  console.log("Bulk product creation finished.");
}

bulkCreateProducts();
