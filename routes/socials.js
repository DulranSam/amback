const express = require("express");
const Router = express.Router();
const socialModel = require("../models/socialModel");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Generate a unique filename
  },
});

const upload = multer({ storage });

Router.route("/")
  .post(upload.single("image"), async (req, res) => {
    const { title, content, userId, tags, category } = req.body;
    const image = req.file ? req.file.path : null;

    // Input validation
    if (!title || !content || !userId) {
      return res
        .status(400)
        .json({ Error: "Title, content, and userId are required" });
    } else if (!category) {
      category = "all";
    }

    try {
      // Create a new blog post document
      const newPost = new socialModel({
        title,
        content,
        userId,
        image,
        tags: tags ? tags.split(",") : [], // Convert tags string to array
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

Router.route("/:category").post(async (req, res) => {
  const category = req.params?.category;
  if (!category) {
    return res.status(400).json({ Alert: "No category provided" });
  }

  try {
    const data = await socialModel.aggregate([
      { $match: { category } }, // Assuming 'category' is a field in your documents
    ]);

    if (data && data.length) {
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ Alert: "No data found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: err.message });
  }
});

Router.route("/search").post(async (req, res) => {
  const { search } = req?.body;
  if (!search) {
    return res.status(400).json({ Alert: "No search criteria provided" });
  }

  try {
    const data = await socialModel.aggregate([{ $match: search }]);

    if (data && data.length) {
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ Alert: "No data found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Error: err.message });
  }
});

module.exports = Router;
