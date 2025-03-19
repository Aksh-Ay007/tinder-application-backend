
const mongoose=require('mongoose')

const ConnectionRequestSchema=new mongoose.Schema({


    fromUserId:{
        type:mongoose.Schema.ObjectId ,
        required:true
    },
    toUserId:{

        type:mongoose.Schema.ObjectId,
        required:true
    },
    status:{
        type:String,
        required:true,
        enum:{
            values:["ignored","interested","accepted","rejected"],
            message:`{VALUE} is incorrect status type`
        }
    }
},{ timestamps: true })


ConnectionRequestSchema.index({fromUserId:1,toUserId:1})

ConnectionRequestSchema.pre('save',async function(next){

    const connectionRequest=this

    //check if from and to toUserId are same

    if(connectionRequest.fromUserId.equals(connectionRequest.toUserId)){
        throw new Error('You cannot send connection request to yourself')
    }
    next();
})



const ConnectionRequestModel=new mongoose.model('ConnectionRequest',ConnectionRequestSchema)

module.exports=ConnectionRequestModel