const { prisma, Prisma } = require("../../lib/prisma");

module.exports = async (io, socket) => {
  // Send message in a chat
  socket.on("send_message", async (data) => {
    try {
      const { type, content, conversationId, receiverId } = data;

      const validTypes = ["TEXT", "FILE"];

      // check type
      if (!validTypes.includes(type)) {
        socket.emit("error", { message: "Invalid message type" });
        return;
      }

      // Verify user is member of this chat
      const memberCheck = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          participants: { some: { user: { id: socket.userId } } },
        },
      });

      if (!memberCheck) {
        socket.emit("error", { message: "Not a member of this chat" });
        return;
      }

      // Save message to database
      const newMessage = await prisma.message.create({
        data: {
          type: type,
          content: content,
          sender: { connect: { id: socket.userId } },
          conversation: { connect: { id: conversationId } },
        },
        select: {
          id: true,
          type: true,
          content: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              profileUrl: true,
              username: true,
            },
          },
          conversationId: true,
        },
      });

      // Emit to all members of this chat
      io.to(`conversation_${conversationId}`).emit("new_message", newMessage);

      // Update chat last_message ... ??
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });
};
