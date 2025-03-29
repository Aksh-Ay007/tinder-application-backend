const express = require('express');
const { userAuth } = require('../middlewares/auth');
const { validateProfileEdit } = require('../utils/validation');
const cloudinary = require('../config/cloudinary');
const profileRouter = express.Router();

// Increase payload size limit
profileRouter.use(express.json({ limit: '10mb' }));
profileRouter.use(express.urlencoded({ limit: '10mb', extended: true }));

profileRouter.get('/profile/view', userAuth, async (req, res) => {
  try {
    const user = req.user;


    res.send(user);
  } catch (error) {
    res.status(400).send('Error: ' + error.message);
  }
});


profileRouter.put('/profile/edit', userAuth, async (req, res) => {
  try {
      if (!validateProfileEdit(req)) {
          return res.status(400).json({
              message: 'Invalid edit request',
              error: 'Validation failed'
          });
      }

      const loggedInUser = req.user;
      const { preview, ...otherFields } = req.body;

      // Photo upload handling
      let uploadResult = null;
      if (preview) {
          // Validate base64 image
          if (!preview.startsWith('data:image/')) {
              return res.status(400).json({ 
                  message: 'Invalid image format' 
              });
          }

          // Check base64 image size
          const base64Size = (preview.length * 3) / 4;
          if (base64Size > 10 * 1024 * 1024) { // 10MB limit
              return res.status(400).json({ 
                  message: 'Image file is too large. Maximum 10MB allowed.' 
              });
          }

          try {
              // Upload image to Cloudinary
              uploadResult = await cloudinary.uploader.upload(preview, {
                  folder: 'profile_photos', 
                  public_id: `user_${loggedInUser._id}_profile`, 
                  overwrite: true, 
                  transformation: [
                      { width: 500, height: 500, crop: "fill" },
                      { quality: "auto" },
                      { max_bytes: 5 * 1024 * 1024 } // 5MB max file size
                  ]
              });

              // Update user's photo URL
              otherFields.photoUrl = uploadResult.secure_url;
          } catch (uploadError) {
              console.error('Cloudinary upload error:', uploadError);
              
              // Handle specific upload errors
              if (uploadError.http_code === 413) {
                  return res.status(400).json({ 
                      message: 'Image file is too large. Maximum 5MB allowed.'
                  });
              }

              return res.status(400).json({ 
                  message: 'Failed to upload profile photo',
                  error: uploadError.message 
              });
          }
      }

      // Update user fields
      Object.keys(otherFields).forEach((key) => {
          loggedInUser[key] = otherFields[key];
      });

      // Save updated user
      await loggedInUser.save();

      res.json({
          message: `${loggedInUser.firstName}: your profile edited successfully`,
          data: loggedInUser
      });
  } catch (error) {
      console.error('Profile edit error:', error);
      res.status(500).json({ 
          message: 'Error editing profile',
          error: error.message 
      });
  }
});

module.exports = profileRouter;