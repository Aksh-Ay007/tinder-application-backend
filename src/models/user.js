const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: "String",
    required: true,
    minLength: 3
    
  },
  lastName: {
    type: "String",
  },
  emailId: {
    type: "String",
    required: true,
    unique: true,
  },
  password: {
    type: "String",
    required: true,
  },
  age: {
    type: "Number",
  },
  gender: {
    type: "String",
  },
  photoUrl: {
    type: "String",
    default:'https://imgs.search.brave.com/TTaNjijvqIhj4FHkGykQrPUeIro0IKcaaLdROt_g2mM/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9hdmF0/YXIuaXJhbi5saWFy/YS5ydW4vcHVibGlj/L2JveQ.jpeg'
  },
  bio: {
    type: "String",
    default: "spread love!❤️",
  },
  hobby: {
    type: ["String"],
  },
  skills:{
    type: ["String"],
  }
},{ timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
