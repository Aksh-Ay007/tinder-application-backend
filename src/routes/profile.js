const express = require('express');
const { userAuth } = require('../middlewares/auth');

const profileRouter = express.Router();

profileRouter.get('/profile', userAuth, async (req, res) => {
  try {
    const user = req.user;
    console.log(user);

    res.send(user);
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});

module.exports = profileRouter;