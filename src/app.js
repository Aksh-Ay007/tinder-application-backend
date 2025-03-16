const express = require('express');
const connectDB =require('./config/database.js');

const app = express();

const User=require('./models/user')


app.use(express.json())




app.post('/signup',async(req,res)=>{

    const user=new User(req.body)

   try {
    await user.save()
    res.send('user addded sucefully')
   } catch (error) {
    
    res.status(400).send('error saving  the user'+err.message)
   }
})




///feed api to see all tinder user details after login to the application


app.get('/user',async(req,res)=>{

    const userEmail=req.body.emailId

    try {
        
        const user=await User.find({emailId:userEmail})

        if(user.length===0){

            res.send('sorry user is not found')
        }
        else{
            res.send(user)
        }
        
    } catch (error) {
        
        res.status(400).send('error')
    }

})


app.get('/feed',async(req,res)=>{

        try {
            const users=await User.find({})
            res.send(users)
        } catch (error) {
            
            res.status(400).send('users not found')
        }
})

app.delete('/user',async(req,res)=>{

    const userId=req.body.userId
   
    
    try {
        
        const users=await User.findByIdAndDelete(userId)
        res.send('user deleted sucefully')

    } catch (error) {
        res.status(400).send('delet not done')

    }
})


app.patch('/user',async(req,res)=>{

    const userId=req.body.userId
    const data=req.body
    try {

        const user=await User.findByIdAndUpdate({_id:userId},data)
        res.send ('updated')
        
    } catch (error) {
        
        res.status(400).send('delet not done')

    }
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





