const express = require("express");
const Router = express.Router();
const feedbackModel = require("../models/feedbackModel");

Router.route("/").post(async (req, res) => { //works
  const { feedback } = req.body;
  if (!feedback) return res.status(400).json({ Alert: "Feedback REQUIRED" });

  try {
    const newFeedback = await feedbackModel.create({ userFeedback: feedback });

    return res.status(201).json({ Alert: `${feedback} Added` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: err.message });
  }
});

module.exports = Router;
