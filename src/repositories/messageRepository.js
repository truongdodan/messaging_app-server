const { prisma } = require("../lib/prisma");

module.exports = {
  async create(data) {
    return await prisma.message.create({
      data: {
        type: data.type,
        content: data.content,
        sender: { connect: { id: data.userId } },
        conversation: { connect: { id: data.conversationId } },
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
  },
  async get(data) {
    return await prisma.conversation.findUnique({
      where: {
        id: data.conversationId,
      },
      select: {
        id: true,
        updatedAt: true,
        type: true,
        profileUrl: true,
        title: true,
        participants: {
          where: { user: { id: { not: data.userId } } },
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
        messages: {
          select: {
            id: true,
            type: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                profileUrl: true,
                username: true,
              },
            },
          },
        },
      },
    });
  },
  async delete(messageId) {
    await prisma.message.delete({
      where: {
        id: messageId,
      },
    });
  },
};
