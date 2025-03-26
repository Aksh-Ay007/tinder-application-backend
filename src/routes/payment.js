const { userAuth } = require('../middlewares/auth');
const express=require('express');
const paymentRouter=express.Router();



paymentRouter.post('/payment/create',userAuth,async(req,res)=>{

    try {
        
    } catch (error) {
        console.log(error)
    }
})






module.exports=paymentRouter