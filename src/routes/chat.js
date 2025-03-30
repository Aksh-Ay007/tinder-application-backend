const Chat = require('../models/chat');
const { userAuth } = require('../middlewares/auth');
const express = require('express');
const mongoose = require('mongoose');
const chatRouter = express.Router();

// Fetch chat details
chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;
  
  try {
    // Find the chat between the two users
    let chat = await Chat.findOne({ participant: { $all: [userId, targetUserId] } })
      .populate({
        path: "messages.senderId",
        select: "firstName lastName emailId photoUrl",
      })
      .populate({
        path: "participant",
        select: "firstName lastName photoUrl",
      });
    
    // If no chat exists, create a new one
    if (!chat) {
      chat = await new Chat({
        participant: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }
    
    res.status(200).json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

// Get all conversations for a user with last message
// Make sure this route is defined BEFORE the /:targetUserId route to avoid conflicts
chatRouter.get("/all", userAuth, async (req, res) => {
  const userId = req.user._id;
  
  try {
    // Convert string ID to ObjectId if needed
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? 
      new mongoose.Types.ObjectId(userId) : userId;
    
    // Find all chats where the user is a participant
    const conversations = await Chat.aggregate([
      // Match chats where the user is a participant
      { $match: { participant: userObjectId } },
      
      // Unwind the messages array to work with individual messages
      { $unwind: { path: "$messages", preserveNullAndEmptyArrays: true } },
      
      // Sort by message timestamp
      { $sort: { "messages.timestamp": -1 } },
      
      // Group back by chat, taking the first message (most recent)
      {
        $group: {
          _id: "$_id",
          participant: { $first: "$participant" },
          lastMessage: { $first: "$messages" },
          messages: { $push: "$messages" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" }
        }
      },
      
      // Calculate unread count
      {
        $addFields: {
          unreadCount: {
            $size: {
              $filter: {
                input: "$messages",
                as: "msg",
                cond: {
                  $and: [
                    { $ne: ["$$msg.senderId", userObjectId] },
                    { $eq: ["$$msg.isRead", false] }
                  ]
                }
              }
            }
          }
        }
      },
      
      // Lookup to get participant details
      {
        $lookup: {
          from: "users",
          localField: "participant",
          foreignField: "_id",
          as: "participantDetails"
        }
      },
      
      // Lookup the sender of the last message
      {
        $lookup: {
          from: "users",
          localField: "lastMessage.senderId",
          foreignField: "_id",
          as: "senderDetails"
        }
      },
      
      // Project only the fields we need
      {
        $project: {
          _id: 1,
          participant: "$participantDetails",
          lastMessage: {
            _id: "$lastMessage._id",
            message: "$lastMessage.message",
            mediaUrl: "$lastMessage.mediaUrl",
            mediaType: "$lastMessage.mediaType",
            timestamp: "$lastMessage.timestamp",
            isRead: "$lastMessage.isRead",
            sender: { $arrayElemAt: ["$senderDetails", 0] }
          },
          unreadCount: 1
        }
      },
      
      // Sort by last message timestamp (most recent first)
      { $sort: { "lastMessage.timestamp": -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch conversations"
    });
  }
});

// Get unread message count for the logged-in user
chatRouter.get("/messages/count", userAuth, async (req, res) => {
    try {
      const userId = req.user._id;
  
      // Count unread messages where the logged-in user is the recipient
      const unreadMessageCount = await Chat.aggregate([
        { $match: { participant: userId } }, // Match chats where the user is a participant
        { $unwind: "$messages" }, // Unwind messages array
        {
          $match: {
            "messages.senderId": { $ne: userId }, // Exclude messages sent by the user
            "messages.isRead": false, // Only count unread messages
          },
        },
        { $count: "unreadCount" }, // Count the number of unread messages
      ]);
  
      const count = unreadMessageCount.length > 0 ? unreadMessageCount[0].unreadCount : 0;
  
      res.status(200).json({ unreadMessages: count });
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      res.status(500).json({ message: "Error fetching unread message count", error: error.message });
    }
  });


module.exports = chatRouter;