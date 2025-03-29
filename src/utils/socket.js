const Chat = require("../models/chat");
const crypto = require("crypto");
const cloudinary = require("../config/cloudinary");

// Helper function to generate a secret room ID
const getSecretRoomId = ({ userId, targetUserId }) => {
  return crypto.createHash("sha256").update([userId, targetUserId].sort().join("_")).digest("hex");
};

// Helper function to upload media to Cloudinary
const uploadMedia = async (mediaData, userId, mediaType) => {
  if (!mediaData || !mediaData.startsWith("data:")) {
    throw new Error("Invalid media format");
  }

  const folder = mediaType === "image" ? "chat_images" : "chat_videos";
  const resourceType = mediaType === "image" ? "image" : "video";

  const uploadResult = await cloudinary.uploader.upload(mediaData, {
    folder,
    resource_type: resourceType,
    public_id: `chat_${userId}_${Date.now()}`,
  });

  return uploadResult.secure_url;
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

  // Track online users and their last seen times
  const onlineUsers = new Map();
  const userLastSeen = new Map();
  const userSocketMap = new Map();

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    let currentUserId = null;

    // User comes online
    socket.on("userOnline", ({ userId }) => {
      if (!userId) return;

      currentUserId = userId;
      onlineUsers.set(userId, socket.id);
      userSocketMap.set(socket.id, userId);
      userLastSeen.set(userId, new Date());

      // Notify others that the user is online
      socket.broadcast.emit("userStatusUpdate", { userId, status: "online" });
    });

    // Join chat room
    socket.on("JoinChat", ({ firstName, userId, targetUserId }) => {
      if (!userId || !targetUserId) return;

      const roomId = getSecretRoomId({ userId, targetUserId });
      console.log(`${firstName} joined chat room: ${roomId}`);
      socket.join(roomId);
    });

    // Handle sending text messages
    socket.on("sendMessage", async ({ firstName, userId, targetUserId, message: newMessage }) => {
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

        // Emit the message to the room
        io.to(roomId).emit("receiveMessage", {
          message: newMessage,
          firstName,
          timestamp: message.timestamp,
          isRead: message.isRead,
          senderId: userId,
        });
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    // Handle sending media messages
    socket.on("sendMediaMessage", async ({ firstName, userId, targetUserId, mediaData, mediaType }) => {
      try {
        if (!userId || !targetUserId || !mediaData || !mediaType) {
          socket.emit("mediaUploadError", { error: "Missing required fields" });
          return;
        }

        const roomId = getSecretRoomId({ userId, targetUserId });

        // Upload media to Cloudinary
        const mediaUrl = await uploadMedia(mediaData, userId, mediaType);

        // Find or create the chat
        let chat = await Chat.findOne({ participant: { $all: [userId, targetUserId] } });
        if (!chat) {
          chat = await Chat.create({
            participant: [userId, targetUserId],
            messages: [],
          });
        }

        // Add the new media message to the chat
        const message = {
          senderId: userId,
          message: mediaType === "image" ? "📷 Photo" : "🎥 Video",
          mediaUrl,
          mediaType,
          chat: chat._id,
          isRead: false,
          timestamp: new Date(),
        };
        chat.messages.push(message);
        await chat.save();

        // Emit the media message to the room
        io.to(roomId).emit("receiveMediaMessage", {
          message: message.message,
          mediaUrl,
          mediaType,
          firstName,
          timestamp: message.timestamp,
          isRead: message.isRead,
          senderId: userId,
        });

        // Notify the sender of successful upload
        socket.emit("mediaUploadSuccess");
      } catch (error) {
        socket.emit("mediaUploadError", { error: error.message });
        console.error("Error saving media message:", error);
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

          messageIds.forEach((messageId) => {
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

    // Handle user disconnecting
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);

      const userId = userSocketMap.get(socket.id) || currentUserId;

      if (userId) {
        userLastSeen.set(userId, new Date());
        onlineUsers.delete(userId);
        userSocketMap.delete(socket.id);

        // Notify others that the user is offline
        socket.broadcast.emit("userStatusUpdate", {
          userId,
          status: "offline",
          lastSeen: userLastSeen.get(userId),
        });
      }
    });
  });

  return io;
};

module.exports = initializeSocket;