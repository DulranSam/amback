const express = require("express");
const Router = express.Router();
const mainModel = require("../models/mainModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.cloudinarycloudname,
  api_key: process.env.cloudinaryapikey,
  api_secret: process.env.cloudinaryapisecret,
});

const storage = multer.diskStorage({});
const upload = multer({ storage });

Router.route("/")
  .post(upload.single("media"), async (req, res) => {
    const { title, description, link, category, commission } = req.body;
    const mediaUrl = req.file ? req.file.path : null;

    if (
      !title ||
      !description ||
      !link ||
      !category ||
      !commission ||
      !mediaUrl
    ) {
      return res.status(400).json({ Alert: "Required fields not filled" });
    }

    try {
      // Upload media (photo or video) to Cloudinary
      const result = await cloudinary.uploader.upload(mediaUrl, {
        resource_type: req.file.mimetype.startsWith('image/') ? "image" : "video",
      });
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
        data = await mainModel.find();
      } else {
        data = await mainModel.find({ category: selectedType });
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
  })


  Router.route("/:id").put(async (req, res) => {
    const id = req?.params?.id;
    const { title, description, mediaUrl, link, category, commission } =
      req?.body;

    if (!id) return res.status(400).json({ Alert: "ID required" });

    try {
      // Find the document by ID
      let data = await mainModel.findById(id);

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
  });



module.exports = Router;
