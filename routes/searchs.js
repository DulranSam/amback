const express = require("express");
const Router = express.Router();
const mainModel = require("../models/mainModel");

Router.route("/").post(async (req, res) => {
  const { search } = req?.body;
  if (!search) return res.status(400).json({ error: "Search criteria required" });

  try {
    const data = await mainModel.aggregate([
      { $match: search },
      // Optionally, you can add more aggregation stages here if needed
    ]);
    if (data && data.length) {
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ message: 'No data found' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = Router;
