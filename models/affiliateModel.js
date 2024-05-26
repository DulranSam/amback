const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  hash: String,
});

module.exports = mongoose.model("Affiliate", affiliateSchema);