const mongoose = require("mongoose");
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength: 3,
    trim: true // Trim whitespace
  },
  lastName: {
    type: String,
    trim: true // Add trim for last name as well
  },
  emailId: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Invalid email address: ' + value);
      }
    },
  },
  password: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    min: [0, 'Age must be a positive number'],
    max: [120, 'Age is not realistic']
  },
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'others'],
      message: `{VALUE} is not a valid gender type`
    },
    set: value => value.toLowerCase(), // Convert to lowercase
    default: 'others' // Provide a default value
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  membershipType: {
    type: String,
  },
  photoUrl: {
    type: String,
    default: 'https://imgs.search.brave.com/TTaNjijvqIhj4FHkGykQrPUeIro0IKcaaLdROt_g2mM/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9hdmF0/YXIuaXJhbi5saWFyYS5ydW4vcHVibGljL2JveA.jpeg',
    validate(value) {
      if (value && !validator.isURL(value)) {
        throw new Error('Invalid photo URL: ' + value);
      }
    },
  },
  bio: {
    type: String,
    default: "Spread love!❤️",
    maxlength: [500, 'Bio cannot be more than 500 characters'] // Add max length
  },
  hobby: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 10; // Limit number of hobbies
      },
      message: 'You can have a maximum of 10 hobbies'
    }
  },
  skills: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 15; // Limit number of skills
      },
      message: 'You can have a maximum of 15 skills'
    }
  },
  authMethod: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
}, { timestamps: true });

// Existing methods remain the same
userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, 'tindersecret123@', { expiresIn: '1d' });
  return token;
}

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const passwordHash = user.password;
  const isPasswordValidate = await bcrypt.compare(passwordInputByUser, passwordHash);
  return isPasswordValidate;
}

const User = mongoose.model("User", userSchema);

module.exports = User;