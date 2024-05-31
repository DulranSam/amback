const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  email: { type: String },
});

const contactModel = mongoose.model("contacts", contactSchema);
module.exports = contactModel;
