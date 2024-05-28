const express = require("express");
const Router = express.Router();
const mainModel = require("../models/mainModel");
const buyModel = require("../models/purchaseModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.cloudinarycloudname,
  api_key: process.env.cloudinaryapikey,
  api_secret: process.env.cloudinaryapisecret,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

Router.route("/search").post(async (req, res) => { //needs to be modified in the frontend
  const { search } = req.body;
  if (!search)
    return res.status(400).json({ error: "Search criteria required" });

  // try {
  //   // Construct aggregation pipeline based on search criteria
  //   const pipeline = [];
  //   // Loop through each key-value pair in the search criteria
  //   Object.entries(search).forEach(([key, value]) => {
  //     // Add $match stage for each key-value pair
  //     // Use regex for partial matches and case-insensitive search
  //     const matchStage = { $match: { [key]: { $regex: `.*${value}.*`, $options: 'i' } } };
  //     pipeline.push(matchStage);
  //   });

  //   // Log the constructed pipeline for debugging
  //   console.log("Constructed Pipeline:", JSON.stringify(pipeline));

  //   // Run the aggregation pipeline
  //   const data = await mainModel.aggregate(pipeline);
  //   if (data && data.length) {
  //     return res.status(200).json(data);
  //   } else {
  //     return res.status(404).json({ message: 'No data found' });
  //   }
  // } catch (err) {
  //   console.error(err);
  //   return res.status(500).json({ error: err.message });
  // }

  try {
    const data = await mainModel.aggregate([
      { $match: { title: { $regex: search, $options: 'i' } } }
    ]);
  
    if (data && data.length) {
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ Alert: "No results found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
  
  
});

Router.route("/")
  .post(upload.single("media"), async (req, res) => {
    const { title, description, link, category, commission, userId } = req.body;
    const mediaBuffer = req.file ? req.file.buffer : null;
    const mediaType = req.file
      ? req.file.mimetype.startsWith("image")
        ? "photo"
        : "video"
      : null;

    if (
      !title ||
      !description ||
      !link ||
      !category ||
      !commission ||
      !mediaBuffer ||
      !mediaType ||
      !userId
    ) {
      return res.status(400).json({ Alert: "Required fields not filled" });
    }

    try {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.userId;

      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        async (error, result) => {
          if (error) throw error;

          const mediaUrlCloud = result.secure_url;

          await mainModel.create({
            title,
            description,
            link,
            category,
            mediaUrl: mediaUrlCloud,
            mediaType,
            commission,
            user: userId,
          });

          return res.status(201).json({ Alert: "Created" });
        }
      );

      uploadStream.end(mediaBuffer);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Error: "Failed to upload media" });
    }
  })
  .get(async (req, res) => {
    const selectedType = req.query.type || "all";

    try {
      // let data;
      // if (selectedType === "all") {
      //   data = await mainModel.find().sort({ createdAt: -1 });
      // } else {
      //   data = await mainModel
      //     .find({ category: selectedType })
      //     .sort({ createdAt: -1 });
      // }

      const data = await mainModel.find().sort({ createdAt: -1 });

      if (data.length) {
        console.log(data);
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
  .put(async (req, res) => { //update item
    const id = req.params.id;
    const { title, description, mediaUrl, link, category, commission } = req.body;

    if (!id)
      return res.status(400).json({ Alert: "ID is required for update" });

    try {
      let data = await mainModel.findById(id);

      if (!data) {
        return res.status(404).json({ Alert: "Item not found" });
      }

      data.title = title;
      data.description = description;
      data.mediaUrl = mediaUrl;
      data.link = link;
      data.category = category;
      data.commission = commission;

      const saved = await data.save();

      if (saved) {
        res.status(200).json(data);
      } else {
        res.status(400).json({ Alert: "Error while saving!" });
      }
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ Error: "Failed to update document" });
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
    } catch (error) {
      console.error("Error fetching document:", error);
      return res.status(500).json({ Error: "Failed to fetch document" });
    }
  });

Router.route("/buy").post(async (req, res) => {
  const { buyItem } = req.body;

  if (!buyItem || !buyItem.title) {
    return res.status(400).json({ Alert: "Buy item details required" });
  }

  try {
    const data = await mainModel.findOne({ title: buyItem.title });

    if (data) {
      await buyModel.create(buyItem);
      return res.status(200).json({ Alert: `Purchased ${buyItem.title}` });
    } else {
      return res.status(404).json({ Alert: "Item not found" });
    }
  } catch (err) {
    console.error("Error purchasing item:", err);
    return res.status(500).json({ Error: "Failed to purchase item" });
  }
});

module.exports = Router;
