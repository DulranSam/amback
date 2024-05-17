const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema({
  affiliateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mains",
    required: true,
  },
});

const Affiliate = mongoose.model("affiliates", affiliateSchema);

module.exports = Affiliate;
