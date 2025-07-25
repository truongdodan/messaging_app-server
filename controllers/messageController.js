const prisma = require("../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query } = require("express-validator");

/* module.exports.getConversationsMessages = [
  [],
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    const messages = await prisma.message.findMany({
      where: { conversation: { id: conversationId } },
      include: { sender: true },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).send(messages);
  }),
]; */

module.exports.createOne = [
  [],
  asyncHandler(async (req, res) => {
    const userId = req.id;
    const { type, content, conversationId, receiverId } = req.body;

    const message = await prisma.$transaction(async (tx) => {
      // make sure conversation exists, else create new one
      const conversation = await tx.conversation.upsert({
        where: { id: conversationId },
        update: {},
        create: {
          creator: { connect: { id: userId } },
          participants: {
            create: [
              { user: { connect: { id: userId } } },
              { user: { connect: { id: receiverId } } },
            ],
          },
        },
      });

      return await tx.message.create({
        data: {
          type: type,
          content: content,
          sender: { connect: { id: userId } },
          conversation: { connect: { id: conversation.id } },
        },
        select: {
          id: true,
        },
      });
    });

    res.status(201).send(message);
  }),
];

module.exports.deleteOne = [
  [],
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await prisma.message.delete({
      where: {
        id: id,
      },
    });
  }),
];
