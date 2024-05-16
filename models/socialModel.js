const mongoose = require("mongoose");

const socialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "Untitled",
  },
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  tags: {
    type: [String],
    default: [],
  },
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});


socialSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const socialModel = mongoose.model("socials", socialSchema);
module.exports = socialModel;
