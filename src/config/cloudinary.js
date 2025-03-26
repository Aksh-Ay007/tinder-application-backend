const cloudinary = require('cloudinary').v2;


 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.CLOUDE_NAME_CLOUDINARY, 
    api_key: process.env.CLOUDINARY_API_KEY, // Click 'View API Keys' above to copy your API key
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

module.exports=cloudinary