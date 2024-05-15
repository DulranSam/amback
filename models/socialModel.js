const mongoose = require("mongoose");
const socialSchema = new mongoose.Schema({
    
})

const socialModel = mongoose.model("socials",socialSchema);
module.exports = socialModel;