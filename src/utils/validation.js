
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


const validateProfileEdit = (req) => {
    const { 
      firstName, 
      lastName, 
      age, 
      gender, 
      bio, 
      hobby, 
      skills 
    } = req.body;
  
    // First name validation
    if (firstName && (firstName.length < 3 || firstName.length > 50)) {
      return false;
    }
  
    // Last name validation (optional)
    if (lastName && lastName.length > 50) {
      return false;
    }
  
    // Age validation
    if (age && (age < 0 || age > 120)) {
      return false;
    }
  
    // Gender validation
    if (gender && !['male', 'female', 'others'].includes(gender.toLowerCase())) {
      return false;
    }
  
    // Bio length validation
    if (bio && bio.length > 500) {
      return false;
    }
  
    // Hobby validation
    if (hobby && (hobby.length > 10 || hobby.some(h => h.length > 50))) {
      return false;
    }
  
    // Skills validation
    if (skills && (skills.length > 15 || skills.some(s => s.length > 50))) {
      return false;
    }
  
    return true;
  };
  


module.exports={
    validationASignupData,validateProfileEdit
}