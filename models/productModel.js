const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  mediaUrl: String,
  mediaType: String,
  link: String,
  category: String,
  commission: Number,
});

module.exports = mongoose.model("Product", productSchema);