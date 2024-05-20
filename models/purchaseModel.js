// models/purchaseModel.js
const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Purchase", purchaseSchema);

