const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  loyaltyPoints: { type: Number, default: 0 },
  hash: String,
});

module.exports = mongoose.model("affiliates", affiliateSchema);
