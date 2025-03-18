const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { validationASignupData } = require('../utils/validation');

const authRoute = express.Router();

authRoute.use(express.json());
authRoute.use(cookieParser());

authRoute.post('/signup', async (req, res) => {
  try {
    validationASignupData(req);
    const { firstName, lastName, emailId, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(passwordHash);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    await user.save();
    res.send('User added successfully');
  } catch (err) {
    res.status(400).send('Error saving the user: ' + err.message);
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
    console.log(isPasswordValidate);

    if (isPasswordValidate) {
      const token = await user.getJWT();
      console.log(token);

      res.cookie('token', token, { expires: new Date(Date.now() + 900000) });
      res.send('User login successful');
    } else {
      throw new Error('Password is not correct');
    }
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});

module.exports = authRoute;