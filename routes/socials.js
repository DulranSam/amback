const express = require("express");
const Router = express.Router();
const socialModel = require("../models/socialModel");

Router.route("/")
  .post(async (req, res) => {
    const {} = req?.body;

    try {
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: err.message });
    }
  })
  .get(async (req, res) => {
    const data = await socialModel.find();
    if (data.length) {
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ Alert: "No results found" });
    }
  });

  

module.exports = Router;
