const prisma = require("../../lib/prisma");
const CustomError = require("../errors/CustomError");

module.exports = async (io, socket) => {
  // Handle user coming online
  const handleUserOnline = async () => {
    try {
      // Update user status to online
      const updateResult = await prisma.user.update({
        where: { id: socket.userId },
        data: { isActive: true },
      });

      // Join personal room for direct notifications
      socket.join(`user_${socket.userId}`);

      // Notify other that this user is online
      const allUsers = await prisma.user.findMany();

      allUsers.forEach((user) => {
        io.to(`user_${user.id}`).emit("user_online", {
          userId: socket.userId,
          username: socket.user.username,
        });
      });
    } catch (error) {
      console.error("Error handling user online:", error);
    }
  };

  // Handle user going offline
  const handleUserOffline = async () => {
    try {
      // Update user status to offline
      const updateResult = await prisma.user.update({
        where: { id: socket.userId },
        data: { isActive: false },
      });

      // Notify other that this user is online
      const allUsers = await prisma.user.findMany();

      allUsers.forEach((user) => {
        io.to(`user_${user.id}`).emit("user_offline", {
          userId: socket.userId,
          username: socket.user.username,
        });
      });
    } catch (error) {
      console.error("Error handling user offline:", error);
    }
  };

  // Call when user connects
  handleUserOnline();

  // Export for use in disconnect handler
  return { handleDisconnect: handleUserOffline };
};
