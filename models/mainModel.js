const mongoose = require("mongoose");

const mainSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  commission: {
    type: Number,
    required: true,
  },
  productType: {
    type: String,
    enum: ["physical", "digital"],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("mains", mainSchema);
