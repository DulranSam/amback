const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  commission: { type: Number, required: true, min: 5 }, // minimum commission rate for companies
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // reference to the company
});

module.exports = mongoose.model("Product", productSchema);
