const express = require("express");
const Router = express.Router();
const contactModel = require("../models/contactModel");

Router.route("/").post(async (req, res) => {
  const { title, description, email } = req?.body;
  if (!title || !description || !email)
    return res.status(400).json({ Alert: "Missing required fields!" });

  try {
    await contactModel.create(req.body).then((status) => {
      if (status) {
        return res.status(201).json({ message: "Inquiry created" });
      } else {
        return res.status(403).json({ message: "Couldn't create inquiry" });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});


module.exports = Router;