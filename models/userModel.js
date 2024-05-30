const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  affiliated: { type: Boolean, default: false },
  affiliateRank:{
    type:Number,
    default:0
  },
  loyaltyPoints: { type: Number, default: 0 },
});

module.exports = mongoose.model("users", userSchema);
