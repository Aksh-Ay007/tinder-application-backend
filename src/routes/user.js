const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const userRouter = express.Router();

const SAFE_DATA_FIELDS = [
  "firstName",
  "lastName",
  "photoUrl",
  "bio",
  "hobby",
  "skills",
];
//get all the pending connection requests for the loggedInUser

userRouter.get("/user/requests/recieved", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequest = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", SAFE_DATA_FIELDS);

    res.json({ message: "data fetch successful", data: connectionRequest });
  } catch (error) {
    res.status(4000).send("Error  :" + error.message);
  }
});

userRouter.get("/user/connetions", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequest = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", SAFE_DATA_FIELDS)
      .populate("toUserId", SAFE_DATA_FIELDS);

    const data = connectionRequest.map((row) => {
      if (row.fromUserId._id.equals(loggedInUser._id)) {
        return row.toUserId;
      } else {
        return row.fromUserId;
      }
    });

    res.json({ message: "data fetch successful", data: data });
  } catch (error) {
    res.status(4000).send("Error  :" + error.message);
  }
});


userRouter.get('/feed',userAuth,async(req,res)=>{

  try {
    //should not see his own card
    //should not see his connections
    //ignored peoples
    //already send connection request to....
    //should see only accepted connections
    // if a entry has already been made in connection request then ignore that
    const loggedInUser = req.user;    
    const page=parseInt(req.query.page)||1
    let limit=parseInt(req.query.limit)||10
    limit>50?limit=50:limit
    const skip=(page-1)*limit
    

    const connectionRequest=await ConnectionRequest.find({
      $or:[{fromUserId: loggedInUser._id},{ toUserId: loggedInUser._id}]
    }).select('fromUserId toUserId')

    const hideUserFromFeed = new Set()
    
    connectionRequest.forEach(req=>{

      hideUserFromFeed.add(req.fromUserId.toString())
      hideUserFromFeed.add(req.toUserId.toString())
    })

    console.log(hideUserFromFeed);

    const users=await User.find({
    $and:[{_id:{$nin:Array.from(hideUserFromFeed)},},{_id:{$ne:loggedInUser._id}}]  
    }).select(SAFE_DATA_FIELDS).skip(skip).limit(limit)
    

    res.send(users)

  } catch (error) {
    res.status(400).send("Error  :" + error.message);

  }
})

module.exports = userRouter;
 