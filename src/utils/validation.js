
const { Error } = require('mongoose')
const validator=require('validator')

const validationASignupData=(req)=>{

    const{firstName,lastName,emailId,password}=req.body

    if(!firstName||!lastName){
        throw new Error('name is not valid')
    }
    else if(firstName.length<4||firstName.length>50){
        throw new Error('name should be 4 to 50 characters')
    }
    else if(!validator.isEmail(emailId)){

        throw new Error('email is not valid')
    }
    else if (!validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })){
        throw new Error('password should be strong')
    }
}


module.exports={
    validationASignupData
}