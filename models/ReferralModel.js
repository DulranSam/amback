const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
  affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Referral", referralSchema);