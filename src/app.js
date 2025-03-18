const express = require('express');
const connectDB = require('./config/database.js');

const app = express();

const User = require('./models/user');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const { validationASignupData } = require('./utils/validation');
const { userAuth } = require('./middlewares/auth');

app.use(express.json());
app.use(cookieParser());

app.post('/signup', async (req, res) => {
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

app.post('/login', async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId: emailId });

    if (!user) {
      throw new Error('Email ID wrong');
    }

    const isPasswordValidate = await user.validatePassword(password)
    console.log(isPasswordValidate);

    if (isPasswordValidate) {
      const token = await user.getJWT()
      console.log(token);

      res.cookie('token', token,{ expires: new Date(Date.now() + 900000) });
      res.send('User login successful');
    } else {
      throw new Error('Password is not correct');
    }
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});

app.get('/profile', userAuth, async (req, res) => {
  try {
    const user = req.user;
    console.log(user);

    res.send(user);
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});

app.get('/user', async (req, res) => {
  const userEmail = req.body.emailId;

  try {
    const user = await User.find({ emailId: userEmail });

    if (user.length === 0) {
      res.send('Sorry, user is not found');
    } else {
      res.send(user);
    }
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});

app.get('/feed', async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(400).send('Users not found: ' + error.message);
  }
});

app.delete('/user', async (req, res) => {
  const userId = req.body.userId;

  try {
    await User.findByIdAndDelete(userId);
    res.send('User deleted successfully');
  } catch (error) {
    res.status(400).send('Delete not done: ' + error.message);
  }
});

app.patch('/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  const data = req.body;

  try {
    const ALLOWED_UPDATES = ['userId', 'age', 'gender', 'bio', 'photoUrl', 'hobby', 'skills'];
    const isUpdateAllowed = Object.keys(data).every((key) => ALLOWED_UPDATES.includes(key));

    if (!isUpdateAllowed) {
      throw new Error("Update not allowed");
    }

    const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });

    if (!user) {
      return res.status(404).send('User not found');
    }

    if (data.skills && data.skills.length > 3) {
      throw new Error("More than 3 skills are not allowed");
    }

    res.send('User updated successfully');
  } catch (err) {
    res.status(400).send('Error updating user: ' + err.message);
  }
});

connectDB().then(() => {
  console.log('Database connection successful');

  app.listen(7777, () => {
    console.log('Server is running');
  });
}).catch((err) => {
  console.log('DB cannot connect: ' + err.message);
});