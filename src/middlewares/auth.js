const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { Error } = require("mongoose");


const userAuth = async (req, res, next) => {
  //read the token  from the req cookie
  //validate token
  //find the user
  try {
    const cookies = req.cookies;
    const { token } = cookies;
    if (!token) {

return res.status(401).send('please login to access the data')

    }

    const decodeObj = await jwt.verify(token, process.env.JWT_SECRET);

    const { _id } = decodeObj;

    const user = await User.findById(_id);

    if (!user) {
      throw new Error("user not found");
    }

    req.user=user
    next();
  } catch (error) {
    res.status(400).send("Error: " + error.message);
  }
};

module.exports = { userAuth };
