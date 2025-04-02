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


// Add these endpoints to your profileRouter.js

// Upload additional photo
profileRouter.post('/profile/photos/add', userAuth, async (req, res) => {
    try {
      const { preview } = req.body;
      const loggedInUser = req.user;
      
      // Validate if user already has maximum photos
      if (loggedInUser.photos && loggedInUser.photos.length >= 8) {
        return res.status(400).json({
          message: 'Maximum photo limit reached (8 photos)'
        });
      }
      
      // Validate base64 image
      if (!preview || !preview.startsWith('data:image/')) {
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
        const uniqueIdentifier = Date.now();
        const uploadResult = await cloudinary.uploader.upload(preview, {
          folder: 'profile_photos',
          public_id: `user_${loggedInUser._id}_gallery_${uniqueIdentifier}`,
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto" },
            { max_bytes: 5 * 1024 * 1024 } // 5MB max file size
          ]
        });
        
        // Add photo to user's photos array
        if (!loggedInUser.photos) {
          loggedInUser.photos = [];
        }
        
        loggedInUser.photos.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id
        });
        
        await loggedInUser.save();
        
        res.json({
          message: 'Photo added successfully',
          data: loggedInUser
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(400).json({
          message: 'Failed to upload photo',
          error: uploadError.message
        });
      }
    } catch (error) {
      console.error('Add photo error:', error);
      res.status(500).json({
        message: 'Error adding photo',
        error: error.message
      });
    }
  });
  
  // Delete photo
  profileRouter.delete('/profile/photos/:publicId', userAuth, async (req, res) => {
    try {
      const { publicId } = req.params;
      const loggedInUser = req.user;
      
      // Find the photo in user's photos array
      const photoIndex = loggedInUser.photos.findIndex(photo => 
        photo.publicId === publicId || photo.publicId.endsWith(`/${publicId}`)
      );
      
      if (photoIndex === -1) {
        return res.status(404).json({
          message: 'Photo not found'
        });
      }
      
      // Remove from Cloudinary
      try {
        await cloudinary.uploader.destroy(loggedInUser.photos[photoIndex].publicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
        // Continue anyway to remove from database
      }
      
      // Remove from user's photos array
      loggedInUser.photos.splice(photoIndex, 1);
      await loggedInUser.save();
      
      res.json({
        message: 'Photo deleted successfully',
        data: loggedInUser
      });
    } catch (error) {
      console.error('Delete photo error:', error);
      res.status(500).json({
        message: 'Error deleting photo',
        error: error.message
      });
    }
  });





module.exports = profileRouter;