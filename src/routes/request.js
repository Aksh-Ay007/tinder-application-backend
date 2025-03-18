const express = require('express');
const { userAuth } = require('../middlewares/auth');

const requestRouter = express.Router();

requestRouter.post('/getConnectionRequest', userAuth, async (req, res) => {
  const user = req.body;
  console.log(user.firstName);
  

  console.log('sending connections...');

  res.send(user.firstName + ' sent the connect request');
});

module.exports = requestRouter;