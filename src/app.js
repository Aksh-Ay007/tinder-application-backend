const express = require('express');
const connectDB =require('./config/database.js');

const app = express();


connectDB().then(()=>{
    console.log('database connection successfully');

    app.listen(7777, () => {
        console.log('Server is running ');
      });
    
})
.catch((err)=>{
    console.log('db cannot connect');
    
})





const PORT = 7777;
