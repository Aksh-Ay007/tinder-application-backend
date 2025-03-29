const ConnectionRequest = require("../models/connectionRequest");
const Chat = require("../models/chat");
const User = require("../models/user"); // Assuming you have a User model
const crypto = require("crypto");

// Store online users and their last active times
const onlineUsers = new Map();
const userLastSeen = new Map();
const userSocketMap = new Map(); // Map user IDs to socket IDs

const getSecretRoomId = ({ userId, targetUserId }) => {
  return crypto.createHash("sha256").update([userId, targetUserId].sort().join("_")).digest("hex");
};

const initializeSocket = (server) => {
  const socket = require("socket.io");
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");
    let currentUserId = null;

    // User comes online
    socket.on("userOnline", ({ userId }) => {
      if (!userId) return;
      
      currentUserId = userId;
      onlineUsers.set(userId, socket.id);
      userSocketMap.set(socket.id, userId);
      userLastSeen.set(userId, new Date());
      
      // Broadcast to all connected users that this user is online
      socket.broadcast.emit("userStatusUpdate", { userId, status: "online" });
      
      // Send the online status of all users to the newly connected user
      socket.emit("initialOnlineUsers", Array.from(onlineUsers.keys()));
    });

    // Join chat room
    socket.on("JoinChat", ({ firstName, userId, targetUserId }) => {
      if (!userId || !targetUserId) return;
      
      const roomId = getSecretRoomId({ userId, targetUserId });
      console.log(`${firstName} joined chat room: ${roomId}`);
      socket.join(roomId);
      
      // Inform the target user that this user is viewing their chat
      if (onlineUsers.has(targetUserId)) {
        io.to(onlineUsers.get(targetUserId)).emit("recipientOnline", { userId });
      }
    });

    // Handle sending messages
    socket.on("sendMessage", async ({ firstName, lastName, userId, targetUserId, message: newMessage }) => {
      try {
        if (!userId || !targetUserId || !newMessage) return;
        
        const roomId = getSecretRoomId({ userId, targetUserId });
        
        // Find or create the chat
        let chat = await Chat.findOne({ participant: { $all: [userId, targetUserId] } });
        if (!chat) {
          chat = await Chat.create({
            participant: [userId, targetUserId],
            messages: [],
          });
        }

        // Add the new message to the chat
        const message = {
          senderId: userId,
          message: newMessage,
          chat: chat._id,
          isRead: false,
          timestamp: new Date(),
        };
        chat.messages.push(message);
        await chat.save();

        // Update last seen time for the sender
        userLastSeen.set(userId, new Date());

        // Get the message ID
        const savedMessage = chat.messages[chat.messages.length - 1];

        // Emit the message to the room
        io.to(roomId).emit("receiveMessage", {
          _id: savedMessage._id,
          message: newMessage,
          firstName,
          lastName,
          timestamp: message.timestamp,
          isRead: message.isRead,
          senderId: userId,
        });
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    // Handle message read status
    socket.on("messageRead", async ({ userId, targetUserId, messageIds }) => {
      try {
        if (!userId || !targetUserId || !messageIds || messageIds.length === 0) return;
        
        const roomId = getSecretRoomId({ userId, targetUserId });
        
        // Update messages as read in the database
        const chat = await Chat.findOne({ participant: { $all: [userId, targetUserId] } });
        if (chat) {
          let updated = false;
          
          // Update the read status of messages
          messageIds.forEach(messageId => {
            const message = chat.messages.id(messageId);
            if (message && message.senderId.toString() === targetUserId) {
              message.isRead = true;
              updated = true;
            }
          });
          
          if (updated) {
            await chat.save();
            
            // Notify the sender that their messages have been read
            io.to(roomId).emit("messagesReadUpdate", { messageIds });
          }
        }
      } catch (error) {
        console.error("Error updating read status:", error);
      }
    });

    // Handle user typing status
    socket.on("userTyping", ({ userId, targetUserId, isTyping }) => {
      if (!userId || !targetUserId) return;
      
      const roomId = getSecretRoomId({ userId, targetUserId });
      socket.to(roomId).emit("typingStatus", { userId, isTyping });
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
      
      // Get user ID from socket ID mapping
      const userId = userSocketMap.get(socket.id) || currentUserId;
      
      if (userId) {
        // Store the last seen time
        userLastSeen.set(userId, new Date());
        
        // Remove from online users
        onlineUsers.delete(userId);
        userSocketMap.delete(socket.id);
        
        // Broadcast to all users that this user went offline
        socket.broadcast.emit("userStatusUpdate", { 
          userId, 
          status: "offline", 
          lastSeen: userLastSeen.get(userId)
        });
      }
    });

    // Add a ping mechanism to track active users
    socket.on("ping", ({ userId }) => {
      if (userId) {
        userLastSeen.set(userId, new Date());
      }
    });
  });

  return io;
};

module.exports = initializeSocket;