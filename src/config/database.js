const mongoose = require('mongoose');

const connectDB = async () => {

  await mongoose.connect('mongodb+srv://AkshayProject:s3xvl5VaYhOQhzDp@cluster0.ddswy.mongodb.net/TinderDb');

};



module.exports=connectDB