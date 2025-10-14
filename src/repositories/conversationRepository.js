const { prisma } = require("../lib/prisma");

module.exports = {
  async get(data) {
    return await prisma.conversation.findMany({
      where: {
        ...(data.type && { type: data.type }),
        participants: {
          some: { user: { id: data.userId } },
        },
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
      },
    });
  },
  async create(data) {
    return await prisma.conversation.create({
      data: {
        creator: { connect: { id: data.userId } },
        participants: {
          create: data.allMemberIds.map((memberId) => ({
            user: { connect: { id: memberId } },
          })),
        },
        ...(data.title && { title: data.title }),
        ...(data.type && { type: data.type }),
        ...(data.profileUrl && { profileUrl: data.profileUrl }),
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
      },
    });
  },
};
