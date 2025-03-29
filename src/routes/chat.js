const Chat = require('../models/chat');
const { userAuth } = require('../middlewares/auth');
const express = require('express');

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

module.exports = chatRouter;


