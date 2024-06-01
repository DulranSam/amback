const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ["user", "company"], required: true },
  affiliated: { type: Boolean, default: false },
  affiliateRank: { type: String, default: "None" },
});

module.exports = mongoose.model("User", userSchema);
