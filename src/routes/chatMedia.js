// Enhanced chatMediaRouter.js
const express = require('express');
const { userAuth } = require('../middlewares/auth');
const cloudinary = require('../config/cloudinary');
const Chat = require('../models/chat');

const chatMediaRouter = express.Router();

// Increase payload size limit
chatMediaRouter.use(express.json({ limit: '10mb' }));
chatMediaRouter.use(express.urlencoded({ limit: '10mb', extended: true }));

// Upload media through REST API
chatMediaRouter.post('/chat/media/:targetUserId', userAuth, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    const { mediaData, mediaType, message } = req.body;
    
    if (!mediaData || !mediaType) {
      return res.status(400).json({
        message: 'Media data and type are required'
      });
    }
    
    // Validate base64 image
    if (!mediaData.startsWith('data:')) {
      return res.status(400).json({
        message: 'Invalid media format'
      });
    }
    
    // Check base64 media size
    const base64Size = (mediaData.length * 3) / 4;
    if (base64Size > 10 * 1024 * 1024) { // 10MB limit
      return res.status(400).json({
        message: 'Media file is too large. Maximum 10MB allowed.'
      });
    }
    
    // Find or create the chat
    let chat = await Chat.findOne({ participant: { $all: [userId, targetUserId] } });
    if (!chat) {
      chat = await Chat.create({
        participant: [userId, targetUserId],
        messages: [],
      });
    }
    
    // Determine folder and resource type
    const folder = mediaType === 'image' ? 'chat_images' : 'chat_videos';
    const resourceType = mediaType === 'image' ? 'image' : 'video';
    
    // Configure transformations based on media type
    const transformations = mediaType === 'image' 
      ? [
          { quality: "auto" },
          { max_bytes: 5 * 1024 * 1024 } // 5MB max file size
        ]
      : [
          { quality: "auto" },
          { max_bytes: 8 * 1024 * 1024 } // 8MB max file size for videos
        ];
    
    try {
      // Upload media to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(mediaData, {
        folder,
        resource_type: resourceType,
        public_id: `chat_${userId}_${Date.now()}`,
        transformation: transformations
      });
      
      // Add the new media message to the chat
      const newMessage = {
        senderId: userId,
        message: message || (mediaType === 'image' ? '📷 Photo' : '🎥 Video'), // Default text for media messages
        mediaUrl: uploadResult.secure_url,
        mediaType,
        chat: chat._id, // Important: Add chat reference
        isRead: false,
        timestamp: new Date(),
      };
      
      chat.messages.push(newMessage);
      await chat.save();
      
      // Get the saved message
      const savedMessage = chat.messages[chat.messages.length - 1];
      
      res.status(201).json({
        success: true,
        message: 'Media uploaded successfully',
        data: {
          _id: savedMessage._id,
          message: savedMessage.message,
          mediaUrl: savedMessage.mediaUrl,
          mediaType: savedMessage.mediaType,
          timestamp: savedMessage.timestamp
        }
      });
      
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      
      // Handle specific upload errors
      if (uploadError.http_code === 413) {
        return res.status(400).json({
          message: 'Media file is too large'
        });
      }
      
      return res.status(400).json({
        message: 'Failed to upload media',
        error: uploadError.message
      });
    }
    
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({
      message: 'Error uploading media',
      error: error.message
    });
  }
});

module.exports = chatMediaRouter;