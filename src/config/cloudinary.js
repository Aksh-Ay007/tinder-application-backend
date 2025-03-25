const cloudinary = require('cloudinary').v2;


 // Configuration
 cloudinary.config({ 
    cloud_name: 'dorodq6pi', 
    api_key: '271265886358437', 
    api_secret: 'tTybTWrzwzxlnJVs8UcS_QrQZIw' // Click 'View API Keys' above to copy your API secret
});

module.exports=cloudinary