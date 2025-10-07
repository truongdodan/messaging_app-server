const { prisma, Prisma } = require("../../lib/prisma");
const onlineUserService = require("../../services/onlineUserService");

module.exports = (io, socket) => {
  // Handle user coming online
  const handleUserOnline = async () => {
    try {
      // Add this socket to user's active connections
      const isFirstDevice = onlineUserService.addUserSocket(
        socket.userId,
        socket.id,
      );

      // Only update db if this is the first device
      if (isFirstDevice) {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { isActive: true },
        });
        // Broadcast to all connected clients that this user is online
        io.emit("user_online", {
          userId: socket.userId,
          username: socket.user.username,
        });

        console.log(`User ${socket.user.username} is now ONLINE`);
      } else {
        console.log(`User ${socket.user.username} connected on Device`);
      }

      // sendlist of current online user to this socket
      const currentlyOnlineUserIds = onlineUserService.getOnlineUserIds();
      socket.emit("online_users_list", {
        userIds: currentlyOnlineUserIds,
      });

      // Join personal roon for notifications
      socket.join(`user_${socket.userId}`);
    } catch (error) {
      console.error("Error handling user online:", error);
    }
  };

  // Handle user going offline
  const handleUserOffline = async () => {
    try {
      // Remove this specific socket connection
      const isLastDevice = onlineUserService.removeUserSocket(
        socket.userId,
        socket.id,
      );

      // Only update offline in db if this was the last device
      if (isLastDevice) {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { isActive: false },
        });

        // Broadcast to all connected clients that user is offline
        io.emit("user_offline", {
          userId: socket.userId,
        });

        console.log(`User ${socket.userId} is now OFFLINE`);
      } else {
        console.log(
          `User ${socket.userId} disconnected from one device, still online on ${onlineUserService.getUserDeviceCount(socket.userId)} device(s)`,
        );
      }
    } catch (error) {
      console.error("Error handling user offline:", error);
    }
  };

  // Call when user connects
  handleUserOnline();

  // Export for use in disconnect handler
  return { handleDisconnect: handleUserOffline };
};
