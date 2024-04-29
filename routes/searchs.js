const express = require("express");
const Router = express.Router();
const mainModel = require("../models/mainModel");

Router.route("/").post(async (req, res) => { 
  const { search } = req.body;
  if (!search) return res.status(400).json({ error: "Search criteria required" });

  try {
    // Construct aggregation pipeline based on search criteria
    const pipeline = [];
    // Loop through each key-value pair in the search criteria
    Object.entries(search).forEach(([key, value]) => {
      // Add $match stage for each key-value pair
      // Use regex for partial matches and case-insensitive search
      const matchStage = { $match: { [key]: { $regex: new RegExp(value, "i") } } };
      pipeline.push(matchStage);
    });

    // Log the constructed pipeline for debugging
    console.log("Constructed Pipeline:", JSON.stringify(pipeline));

    // Run the aggregation pipeline
    const data = await mainModel.aggregate(pipeline);
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
