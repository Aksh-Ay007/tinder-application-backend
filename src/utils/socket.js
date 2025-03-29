const Chat = require("../models/chat");
const crypto = require("crypto");

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

    // Join chat room
    socket.on("JoinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId({ userId, targetUserId });
      console.log(`${firstName} joined chat room: ${roomId}`);
      socket.join(roomId);
    });

    // Handle sending messages
    socket.on("sendMessage", async ({ firstName, lastName, userId, targetUserId, message: newMessage }) => {
      try {
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
          lastName,
          timestamp: message.timestamp,
          isRead: message.isRead,
          senderId: userId,
        });
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};

module.exports = initializeSocket;