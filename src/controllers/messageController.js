const prisma = require("../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query, param } = require("express-validator");

module.exports.createOne = [
  [
    body("type")
      .trim()
      .notEmpty()
      .withMessage("Message's type cannot be empty"),

    body("content")
      .trim()
      .notEmpty()
      .withMessage("You have to write some message in order to send it."),

    body("conversationId").trim().optional(),

    body("receiverId")
      .trim()
      .notEmpty()
      .withMessage("Receiver's id cannot be empty"),
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
      });
    });

    res.status(201).send(message);
  }),
];

module.exports.deleteOne = [
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

    const result = await prisma.message.delete({
      where: {
        id: id,
      },
    });

    res.status(203).send(result);
  }),
];
