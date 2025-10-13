const asyncHandler = require("express-async-handler");
const CustomError = require("../errors/CustomError");
const messageService = require("../services/messageService");
const {
  validataGetMessagesConversationById,
} = require("../validators/messageValidator");

const createFileMessage = asyncHandler(async (req, res) => {
  const file = req.file;
  const { conversationId } = req.body;

  if (!file) {
    throw new CustomError("Input Error", "No file provided", 400);
  }

  if (!conversationId) {
    throw new CustomError("Input Error", "No conversationId provided", 400);
  }

  // Create new file message
  const newMessage = await messageService.createFileMessage({
    file,
    conversationId,
    userId: req.id,
  });

  res.json({ message: newMessage });
});

const getMessagesByConversationId = asyncHandler(async (req, res) => {
  const { conversationId } = validataGetMessagesConversationById(req.params);

  const conversationWithMessages = await messageService.getMessages({
    conversationId,
    userId: req.id,
  });

  res.status(200).send(conversationWithMessages);
});

module.exports = {
  createFileMessage,
  getMessagesByConversationId,
};
