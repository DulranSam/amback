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
  .post(upload.single("video"), async (req, res) => {
    const { title, description, link, category, commission } = req.body;
    const videoUrl = req.file ? req.file.path : null;

    if (!title || !description || !link || !category || !commission || !videoUrl) {
      return res.status(400).json({ Alert: "Required fields not filled" });
    }

    try {
      // Upload video to Cloudinary
      const result = await cloudinary.uploader.upload(videoUrl, {
        resource_type: "video",
      });
      const videoUrlCloud = result.secure_url;

      // Create the document in the database
      await mainModel.create({
        title,
        description,
        link,
        category,
        videoUrl: videoUrlCloud,
        commission,
      });
      return res.status(201).json({ Alert: "Created" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: "Failed to upload video" });
    }
  })
  .get(async (req, res) => {
    const selectedType = req.query.type || "all";

    try {
      let data;
      if (selectedType === "all") {
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
  });

module.exports = Router;
