const { prisma, Prisma } = require("../../lib/prisma");

const chatHandler = (io, socket) => {
  // Join all conversations when user connects
  socket.on("join_conversations", async () => {
    try {
      // find all conversation this user is a member of
      // if conversation is DIRECT return other person infor, else return only conversation infor
      const userConversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: { user: { id: socket.userId } },
          },
        },
        select: { id: true },
      });

      // Join all chat rooms
      userConversations.forEach((conversation) => {
        socket.join(`conversation_${conversation.id}`);
      });
    } catch (error) {
      console.error("Error joining chats:", error);
    }
  });

  // Create new chat
  socket.on("create_conversation", async (data, callback) => {
    try {
      const { title, type, profileUrl, allMemberIds = [] } = data; // type: 'DIRECT' or 'GROUP'
      allMemberIds.push(socket.userId);

      // Create chat
      const newConversation = await prisma.conversation.create({
        data: {
          creator: { connect: { id: socket.userId } },
          participants: {
            create: allMemberIds.map((memberId) => ({
              user: { connect: { id: memberId } },
            })),
          },
          ...(title && { title }),
          ...(type && { type }),
          ...(profileUrl && { profileUrl }),
        },
        select: {
          id: true,
          updatedAt: true,
          type: true,
          profileUrl: true,
          title: true,
          participants: {
            where: { user: { id: { not: socket.userId } } },
            select: {
              user: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  username: true,
                  profileUrl: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      // return new conversation
      if (callback) {
        callback(newConversation);
      }

      // Make all online members join the socket room
      allMemberIds.forEach((memberId) => {
        io.to(`user_${memberId}`).emit("new_conversation", newConversation);

        // If they're online, make them join the room
        const memberSockets = Array.from(io.sockets.sockets.values()).filter(
          // Get every socket that user have on mul device
          (s) => s.userId === memberId,
        );
        memberSockets.forEach((s) =>
          s.join(`conversation_${newConversation.id}`),
        );
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      socket.emit("error", { message: "Failed to create conversation" });
    }
  });
};

module.exports = chatHandler;
