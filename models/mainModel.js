const mongoose = require("mongoose");

const mainSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
    trim: true,
    maxlength: 20,
  },
  description: {
    type: String,
    required: true,
    minlength: 5,
    trim: true,
    maxlength: 20,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    required: true,
    enum: ["photo", "video"],
  },
  link: {
    type: String,
    required: true,
    minlength: 5,
    trim: true,
    maxlength: 20,
  },
  category: {
    type: String,
    default: "all",
    required: true,
    minlength: 5,
    trim: true,
    maxlength: 20,
  },
  commission: {
    type: String,
    default: "default",
    required: true,
    minlength: 5,
    trim: true,
    maxlength: 20,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    unique: true,
    auto: true,
  },
  affilates: {
    type: [String],
    default: [],
  },
});

const mainModel = mongoose.model("mains", mainSchema);

module.exports = mainModel;
