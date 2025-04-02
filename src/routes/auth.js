const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { validationASignupData } = require('../utils/validation');
const crypto = require('crypto'); // Add this import


const authRoute = express.Router();

authRoute.use(express.json());
authRoute.use(cookieParser());

authRoute.post('/signup', async (req, res) => {
  try {
    validationASignupData(req);
    const { firstName, lastName, emailId, password, age, gender, photoUrl, bio, hobby, skills } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
      photoUrl,
      bio,
      hobby,
      skills
    });

    await user.save();
    // Generate a token for the new user
    const token = await user.getJWT();
    
    // Set the token in a cookie
    res.cookie('token'
    , token, { expires: new Date(Date.now() + 900000) });
    
    // Return user data in the expected format
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: 'Error saving the user: ' + err.message
    });
  }
});



authRoute.post('/login', async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId: emailId });

    if (!user) {
      throw new Error('Email ID wrong');
    }

    const isPasswordValidate = await user.validatePassword(password);


    if (isPasswordValidate) {
      const token = await user.getJWT();
   

      res.cookie('token', token, { expires: new Date(Date.now() + 900000) });
      res.send(user);
    } else {
      throw new Error('Password is not correct');
    }
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});


// Google Signup Route
authRoute.post('/google/signup', async (req, res) => {
  try {
    const { Name, emailId, photoURL } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists. Please login instead.'
      });
    }

    // Generate a temporary secure password
    const temporaryPassword = crypto.randomBytes(20).toString('hex');
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Create new user
    const newUser = new User({
      firstName: Name.split(' ')[0] || 'Google',
      lastName: Name.split(' ').slice(1).join(' ') || 'User',
      emailId,
      password: passwordHash,
      photoUrl: photoURL || undefined,
      authMethod: 'google',
      gender: 'others',
      age: null,
      bio: 'Signed up with Google',
      authMethod: 'google',
      hobby: [],
      skills: []
    });

    // Save the new user
    await newUser.save();

    // Generate JWT token
    const token = await newUser.getJWT();

    // Set cookie
    res.cookie('token', token, { 
      expires: new Date(Date.now() + 900000),
      httpOnly: true
    });

    // Return user data
    res.status(201).json({
      success: true,
      message: 'Google Signup successful',
      user: newUser
    });

  } catch (error) {
    console.error('Google Signup Error:', error);
    res.status(500).json({
      success: false,
      message: 'Google Signup failed',
      error: error.message
    });
  }
});

// Google Login Route
authRoute.post('/google/login', async (req, res) => {
  try {
    const { emailId } = req.body;

    // Find user by email
    const user = await User.findOne({  emailId: emailId  });

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'We could not find an account associated with this email. Please sign up to create a new account.'
      });
    }

    // Check if the user signed up with Google
    if (user.authMethod !== 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account was not created with Google. Please login normally.'
      });
    }

    // Generate JWT token
    const token = await user.getJWT();

    // Set cookie
    res.cookie('token', token, { 
      expires: new Date(Date.now() + 900000),
      httpOnly: true
    });

    // Return user data
    res.status(200).json({
      success: true,
      message: 'Google Login successful',
      user: user
    });

  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Google Login failed',
      error: error.message
    });
  }
});


authRoute.post('/logout', async (req, res) => {
  res.cookie('token', null, { expires: new Date(Date.now()) });
  res.send('User logged out successfully');
});

module.exports = authRoute;