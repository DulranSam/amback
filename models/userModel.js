const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    gmail:{
        default:"example@gmail.com",
        trim:true,
        minlength:5,
        maxlength:20,
        type:String,
    },
    password:{
        default:"guest123",
        trim:true,
        minlength:5,
        maxlength:20,
        type:String,
    }
},{timestamps:true});

const userModel = mongoose.model("users",userSchema);

module.exports = userModel;
