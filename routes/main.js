const express = require("express");
const Router = express.Router();
const mainModel = require("../models/mainModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken"); // Import jwt module
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.cloudinarycloudname,
  api_key: process.env.cloudinaryapikey,
  api_secret: process.env.cloudinaryapisecret,
});

const storage = multer.memoryStorage(); // Use memory storage for multer
const upload = multer({ storage });

Router.route("/")
  .post(upload.single("media"), async (req, res) => {
    const { title, description, link, category, commission } = req.body;
    const mediaBuffer = req.file ? req.file.buffer : null; // Use req.file.buffer

    if (
      !title ||
      !description ||
      !link ||
      !category ||
      !commission ||
      !mediaBuffer
    ) {
      return res.status(400).json({ Alert: "Required fields not filled" });
    }

    try {
      // Upload media (photo or video) to Cloudinary
      const result = await cloudinary.uploader
        .upload_stream({ resource_type: "auto" }, async (error, result) => {
          if (error) throw error;

          const mediaUrlCloud = result.secure_url;
          // Create the document in the database
          await mainModel.create({
            title,
            description,
            link,
            category,
            mediaUrl: mediaUrlCloud,
            commission,
          });
          return res.status(201).json({ Alert: "Created" });
        })
        .end(mediaBuffer);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: "Failed to upload media" });
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
    const {
      title,
      description,
      mediaUrl,
      link,
      category,
      commission,
      gmail,
      password,
    } = req.body;

    if (!id || !gmail || !password)
      return res
        .status(400)
        .json({ Alert: "ID and user authentication required" });

    try {
      // Decode the token to get user ID
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET); // Use JWT_SECRET from process.env
      const userId = decodedToken.userId;

      // Find the document by ID
      let data = await mainModel.findById(id);

      // Check if the user who added the item is trying to edit it
      if (data.userId !== userId) {
        // Assuming data.userId holds the user ID who added the item
        return res.status(401).json({
          Alert: "Unauthorized. You are not allowed to modify this item.",
        });
      }

      // Update the document fields with the new values from the request body
      data.title = title;
      data.description = description;
      data.mediaUrl = mediaUrl;
      data.link = link;
      data.category = category;
      data.commission = commission;

      // Save the updated document
      const saved = await data.save();

      // Respond with the updated document
      if (saved) {
        res.status(200).json(data);
      } else {
        res.status(400).json({ alert: "Error while saving!" });
      }
    } catch (error) {
      // Handle any errors that occur during the update process
      console.error("Error updating document:", error);
      res.status(500).json({ Error: "Failed to update document" });
    }
  })
  .get(async (req, res) => {
    const id = req.params.id;

    if (!id) return res.status(400).json({ Alert: "ID Required" });

    const theItem = await mainModel.findById(id);
    if (!theItem) {
      return res.status(404).json({ Alert: "Item doesn't exist!" });
    } else {
      return res.status(200).json(theItem);
    }
  });

module.exports = Router;
