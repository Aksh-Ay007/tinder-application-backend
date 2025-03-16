const express = require('express');
const connectDB =require('./config/database.js');

const app = express();

const User=require('./models/user')




app.post('/signup',async(req,res)=>{

    const user=new User({
        firstName:'Akshay',
        lastName:'jyothi',
        emailId:"test@gmail.com",
        password:'akshay123'
    })

    await user.save()
    res.send('user addded sucefully')
})


connectDB().then(()=>{
    console.log('database connection successfullyyyyyyyyyy');

    app.listen(7777, () => {
        console.log('Server is running ');
      });
    
})
.catch((err)=>{
    console.log('db cannot connect');
    
})





