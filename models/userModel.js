const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    gmail: {
      default: "example@gmail.com",
      trim: true,
      type: String,
    },
    password: {
      default: "guest123",
      trim: true,
      type: String,
    },
    affiliated:{
      type:Boolean,
      default:false,
    }
  },
  { timestamps: true }
);

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
