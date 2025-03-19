const mongoose = require("mongoose");
const validator=require('validator')
const bcrypt=require('bcrypt')
const jwt = require('jsonwebtoken');

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
    validate(value){

        if(!validator.isEmail(value)){
            throw new Error('invalid email address'+value)
        }
    }, 
  },
  password: {
    type: "String",
    required: true,
    // validate(value){

    //     if(!validator.isStrongPassword(value)){
    //         throw new Error('enter a strong password:   ',+value)
    //     }
    // }, 
  },
  age: {
    type: "Number",
  },
  gender: {
    type: "String",
    enum:{
      values:['male','female','others'],
      message:`{VALUE} is not a gender type`
    },
    // validate(value){

    //   if(!['male','female','others'].includes(value)){
    //     throw new Error('gender data is not valid')
    //   }
    // }
  },
  photoUrl: {
    type: "String",
    default:'https://imgs.search.brave.com/TTaNjijvqIhj4FHkGykQrPUeIro0IKcaaLdROt_g2mM/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9hdmF0/YXIuaXJhbi5saWFy/YS5ydW4vcHVibGlj/L2JveQ.jpeg',
    validate(value){

        if(!validator.isURL(value)){
            throw new Error('invalid photoUrl'+value)
        }
    }, 
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



userSchema.methods.getJWT=async function(){
  const user=this

  const token=await jwt.sign({ _id: user._id }, 'tindersecret123@',{ expiresIn: '1d' });

  return token

}


userSchema.methods.validatePassword=async function(passwordInputByUser){
  const user=this
  const passwordHash=user.password
      const isPasswordValidate = await bcrypt.compare(passwordInputByUser, passwordHash);

      return isPasswordValidate
  
}

const User = mongoose.model("User", userSchema);



module.exports = User;
