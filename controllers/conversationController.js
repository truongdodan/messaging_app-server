const prisma = require("../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query } = require("express-validator");

module.exports.getOneAndAllMessages = [
  [],
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const conversations = await prisma.conversation.findUnique({
      where: {
        id: id,
      },
      include: {
        messages: {
          select: {
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

    res.status(200).send(conversations);
  }),
];

module.exports.getAny = [
  [],
  asyncHandler(async (req, res) => {
    const userId = "cmd8dsnsh0000xgdka1vum2ht"; //req.id;
    const { type } = req.query;

    // find all conversation in which current user participates in
    // if conversation is DIRECT return other person infor, else return only conversation infor
    const conversations = await prisma.conversation.findMany({
      where: {
        type: type,
        participants: {
          some: { user: { id: userId } },
        },
      },
      select: {
        id: true,
        updatedAt: true,
        type: true,
        ...(type === "DIRECT" && {
          participants: {
            where: { user: { id: { not: userId } } },
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
        }),
      },
    });

    res.status(200).send(conversations);
  }),
];

module.exports.getGlobalConversation = [
  [],
  asyncHandler(async (req, res) => {
    const globalConversationId = "";

    const conversations = await prisma.conversation.findUnique({
      where: {
        id: globalConversationId,
      },
      include: {
        messages: true,
      },
    });
  }),
];
