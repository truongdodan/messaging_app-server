const socketIo = require("socket.io");
const socketAuth = require("./middleware/socketAuth");
const messageHandler = require("./handlers/messageHandler");
const conversationHandler = require("./handlers/conversationHandler");
const userHandler = require("./handlers/userHandler");

function setupSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.id})`);

    // Register event handlers
    messageHandler(io, socket);
    conversationHandler(io, socket);
    const { handleDisconnect } = userHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
      // Handle user going offline
      handleDisconnect();
    });
  });

  return io;
}

module.exports = setupSocket;
