const axios = require("axios");
const { faker } = require("@faker-js/faker");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function bulkCreateOrders() {
  const endpoint = "http://localhost:3000/api/orders";
  const PRODUCT_ID_MIN = 50;
  const PRODUCT_ID_MAX = 75;
  const BATCH_SIZE = 4; // Adjust as needed for your server
  const TOTAL = 7000;

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    const requests = [];
    for (let j = 0; j < BATCH_SIZE && i + j < TOTAL; j++) {
      // Each order will have 1-5 items
      const itemsCount = faker.number.int({ min: 1, max: 5 });
      const items = [];
      for (let k = 0; k < itemsCount; k++) {
        items.push({
          productId: faker.number.int({
            min: PRODUCT_ID_MIN,
            max: PRODUCT_ID_MAX,
          }),
          quantity: faker.number.int({ min: 1, max: 5 }),
        });
      }

      const order = {
        items,
        shippingAddress: faker.location.streetAddress(),
        paymentMethod: faker.helpers.arrayElement([
          "credit_card",
          "paypal",
          "bank_transfer",
        ]),
      };

      requests.push(
        axios.post(endpoint, order).catch((err) => {
          console.error(
            `Error on order #${i + j + 1}:`,
            err.response?.data || err.message
          );
        })
      );
    }

    await Promise.all(requests);
    await sleep(200); // Add delay between batches (adjust as needed)
    console.log(`Created orders: ${Math.min(i + BATCH_SIZE, TOTAL)}/${TOTAL}`);
  }

  console.log("Bulk order creation finished.");
}

bulkCreateOrders();
