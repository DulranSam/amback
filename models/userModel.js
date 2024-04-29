const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      default: "guest",
      trim: true,
      type: String,
    },
    password: {
      default: "guest123",
      trim: true,
      type: String,
    },
  },
  { timestamps: true }
);

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
