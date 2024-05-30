const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'purchases',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const RefundModel = mongoose.model('refunds', refundSchema);

module.exports = RefundModel;