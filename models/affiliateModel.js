const mongoose = require("mongoose");
const affiliateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  referralCode: {
    type: String,
    unique: true,
  },
  earnings: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  affiliateId:{
    
  }
});

const Affiliate = mongoose.model("affialiates", affiliateSchema);

module.exports = Affiliate;
