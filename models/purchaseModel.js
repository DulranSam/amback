const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('purchases', purchaseSchema);
