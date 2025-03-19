const express=require('express')
const {userAuth}=require('../middlewares/auth')
const ConnectionRequest=require('../models/connectionRequest')

const userRouter=express.Router()

//get all the pending connection requests for the loggedInUser

userRouter.get('/user/requests/recieved',userAuth, async(req,res)=>{

    try {
        const loggedInUser=req.user

        const connectionRequest=await ConnectionRequest.find({
            toUserId:loggedInUser._id,
            status:'interested'
        
        })

        res.json({message:'data fetch successful',data:connectionRequest})

    } catch (error) {
        
        res.status(4000).send("Error  :"+error.message)
    }
})



module.exports=userRouter