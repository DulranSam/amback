const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema({
  affiliateId: {
    type: String,
    trim: true,
    unique: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mains",
    required: true,
  },
});

const Affiliate = mongoose.model("affiliates", affiliateSchema);

module.exports = Affiliate;
