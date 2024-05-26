const mongoose = require('mongoose');

const mainSchema = new mongoose.Schema({
  title: String,
  description: String,
  mediaUrl: String,
  mediaType: String,
  link: String,
  category: String,
  commission: Number,
});

module.exports = mongoose.model('Product', mainSchema);
