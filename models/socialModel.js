// models/socialModel.js
const mongoose = require("mongoose");

const socialSchema = new mongoose.Schema({ //later
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: {
    type: String,
    default: "general",
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  image: { type: String }, // URL or file path to the uploaded image
  tags: { type: [String] }, // Array of tags
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      comment: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("socials", socialSchema);
