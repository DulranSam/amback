const mongoose = require("mongoose");

const ReferralSchema = new mongoose.Schema({
  affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Referral", ReferralSchema);
