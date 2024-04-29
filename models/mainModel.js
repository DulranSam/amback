const mongoose = require("mongoose");

const mainSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
    trim: true,
    maxlength: 50, // Increased maxlength for title
  },
  description: {
    type: String,
    required: true,
    minlength: 5,
    trim: true,
    maxlength: 200, // Increased maxlength for description
  },
  photo: {
    type: String,
    required: true,
  },
  links: [
    {
      type: String,
      minlength: 5,
      trim: true,
      maxlength: 200, // Increased maxlength for links
    }
  ],
  category: {
    type: String,
    default: "all",
    required: true,
    minlength: 5,
    trim: true,
    maxlength: 20,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
});

const mainModel = mongoose.model("mains", mainSchema);

module.exports = mainModel;
