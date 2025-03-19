const express = require('express');
const { userAuth } = require('../middlewares/auth');
const { validateProfileEdit } = require('../utils/validation');


const profileRouter = express.Router();

profileRouter.get('/profile/view', userAuth, async (req, res) => {
  try {
    const user = req.user;
    console.log(user);

    res.send(user);
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});


profileRouter.patch('/profile/edit',userAuth ,async(req,res)=>{

  try {
    
    if(!validateProfileEdit(req)){
    
      throw new Error('invalid edit reqest')

    }

    const logedInUser= req.user

    Object.keys(req.body).forEach((key)=>logedInUser[key]=req.body[key])
    await logedInUser.save()
    res.json({message:`${logedInUser.firstName} : your profile edited sucesully`,
      data:logedInUser
    })
    

  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  
  }
})

module.exports = profileRouter;