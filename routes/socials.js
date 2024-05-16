const express = require("express");
const Router = express.Router();
const socialModel = require("../models/socialModel");

Router.route("/")
  .post(async (req, res) => {
    const { title, content, userId, comments } = req.body;

    // Input validation
    if (!title || !content || !userId) {
      return res.status(400).json({ Error: "Title, content, and userId are required" });
    }

    try {
      // Create a new blog post document
      const newPost = new socialModel({
        title,
        content,
        userId,
        comments: comments || []
      });

      // Save the document to the database
      const savedPost = await newPost.save();

      // Respond with the saved document
      return res.status(201).json(savedPost);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: err.message });
    }
  })
  .get(async (req, res) => {
    try {
      const data = await socialModel.find();
      if (data.length) {
        return res.status(200).json(data);
      } else {
        return res.status(404).json({ Alert: "No results found" });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: err.message });
    }
  });

module.exports = Router;
