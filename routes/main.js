const express = require("express");
const Router = express.Router();
const mainModel = require("../models/mainModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();

Router.route("/")
  .post(async (req, res) => {
    const { title, description, category, links } = req.body;
    const mediaUrl = req.file ? req.file.path : null;

    if (!title || !description || !mediaUrl || !category || !links) {
      return res.status(400).json({ Alert: "Required fields not filled" });
    }

    try {
      // Decode the token to get user ID
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.userId;

      // Create the document in the database
      await mainModel.create({
        title,
        description,
        photo: mediaUrl,
        category,
        commission,
        links,
        user: userId,
      });

      return res.status(201).json({ Alert: "Created" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: "Failed to create item" });
    }
  })
  .get(async (req, res) => {
    const selectedType = req.query.type || "all";

    try {
      let data;
      if (selectedType === "all" || selectedType) {
        data = await mainModel.find().sort({ createdAt: -1 });
      } else {
        data = await mainModel
          .find({ category: selectedType })
          .sort({ createdAt: -1 });
      }

      if (data.length) {
        return res.status(200).json(data);
      } else {
        return res.status(404).json({ Alert: "No results found" });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: "Internal server error" });
    }
  });

Router.route("/:id")
  .put(async (req, res) => {
    const id = req.params.id;
    const { title, description, photo, category, commission, links } = req.body;

    if (!id) return res.status(400).json({ Alert: "ID Required" });

    try {
      // Decode the token to get user ID
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.userId;

      // Find the document by ID
      let data = await mainModel.findById(id);

      // Check if the user who added the item is trying to edit it
      if (data.user.toString() !== userId) {
        return res.status(401).json({
          Alert: "Unauthorized. You are not allowed to modify this item.",
        });
      }

      // Update the document fields with the new values from the request body
      data.title = title;
      data.description = description;
      data.photo = photo;
      data.category = category;
      data.commission = commission;
      data.links = links;

      // Save the updated document
      await data.save();

      // Respond with the updated document
      return res.status(200).json(data);
    } catch (error) {
      // Handle any errors that occur during the update process
      console.error("Error updating document:", error);
      return res.status(500).json({ Error: "Failed to update document" });
    }
  })
  .get(async (req, res) => {
    const id = req.params.id;

    if (!id) return res.status(400).json({ Alert: "ID Required" });

    try {
      const theItem = await mainModel.findById(id);
      if (!theItem) {
        return res.status(404).json({ Alert: "Item doesn't exist!" });
      } else {
        return res.status(200).json(theItem);
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: "Internal server error" });
    }
  });

module.exports = Router;
