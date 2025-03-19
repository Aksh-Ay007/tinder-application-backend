const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const mongoose = require('mongoose');

const requestRouter = express.Router();

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;
      const allowedStatus = ["ignored", "interested"];

      if (!allowedStatus.includes(status)) {
        return res
          .status(400)
          .json({ message: "Invalid status type: " + status });
      }


      const toUser = await User.findById(toUserId);
      console.log(toUser, 'I am user');

      if (!toUser) {
        return res.status(404).json({ message: 'This user does not exist' });
      }

      // Check if there is any existing connection request
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [{ fromUserId, toUserId }, { fromUserId: toUserId, toUserId: fromUserId }],
      });

      if (existingConnectionRequest) {
        // Update the status of the existing connection request
        existingConnectionRequest.status = status;
        const updatedConnectionRequest = await existingConnectionRequest.save();
        return res.json({
          message: `${req.user.firstName} is ${status} in ${toUser.firstName}`,
          data: updatedConnectionRequest,
        });
      }


      const newConnectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await newConnectionRequest.save();
      res.json({
        message: `${req.user.firstName} is ${status} in ${toUser.firstName}`,
        data,
      }); 
    } catch (error) {
      res.status(400).send("Error: " + error.message);
    }
  }
);

/*
requestRouter.post('/request/review/:status/:requestId', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
  } catch (error) {
  }
});
*/

module.exports = requestRouter;