const { Outbox } = require("../models");

async function writeOutbox({ aggregatetype, aggregateid, type, payload }) {
  await Outbox.create({
    aggregatetype,
    aggregateid,
    type,
    payload,
  });
}

module.exports = { writeOutbox };
