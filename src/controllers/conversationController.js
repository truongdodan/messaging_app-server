const { prisma, Prisma } = require("../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query, param, validationResult } = require("express-validator");

module.exports.getOneAndAllMessages = [
  [
    param("id")
      .trim()
      .notEmpty()
      .withMessage("Conversation id cannot be empty"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new CustomError(
        "Input Error",
        "Some inputs are invalid. Please check and try again.",
        400,
        errors.array(),
      );
    }

    const { id } = req.params;
    const userId = req.id;

    const conversations = await prisma.conversation.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        updatedAt: true,
        type: true,
        profileUrl: true,
        title: true,
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

    res.status(200).send(conversations);
  }),
];

module.exports.getAny = [
  [query("type").trim().optional()],
  asyncHandler(async (req, res) => {
    const userId = req.id;
    const { type } = req.query;

    // find all conversation in which current user participates in
    // if conversation is DIRECT return other person infor, else return only conversation infor
    /* const conversations = await prisma.conversation.findMany({
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
    }); */
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
        profileUrl: true,
        title: true,
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
      },
    });

    res.status(200).send(conversations);
  }),
];

module.exports.haveConversationWith = [
  [param("id").trim().notEmpty().withMessage("userId cannot be empty")],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new CustomError(
        "Input Error",
        "Some inputs are invalid. Please check and try again.",
        400,
        errors.array(),
      );
    }

    const userId = req.id;
    const { id } = req.query;

    // find all conversation in which current user participates in
    // if conversation is DIRECT return other person infor, else return only conversation infor
    const conversations = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          {
            participants: {
              some: { userId: { id: userId } },
              some: { userId: { id: id } },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    res.status(200).send(conversations);
  }),
];

module.exports.getGlobalConversation = [
  [],
  asyncHandler(async (req, res) => {
    const globalConversationId = "";

    const globalConversation = await prisma.conversation.findUnique({
      where: {
        id: globalConversationId,
      },
      include: {
        messages: true,
      },
    });

    res.status(200).send(globalConversation);
  }),
];
