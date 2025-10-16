const asyncHandler = require("express-async-handler");
const {
  validateGetConversation,
} = require("../validators/conversationValidator");
const conversationService = require("../services/conversationService");

const getAny = asyncHandler(async (req, res) => {
  const { type } = validateGetConversation(req.query);

  const conversations = await conversationService.getConversations({
    ...(type && { type }),
    userId: req.id,
  });

  res.status(200).send(conversations);
});

module.exports = {
  getAny,
};
