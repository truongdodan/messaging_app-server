const Joi = require("joi");

const cuidPattern = /^c[a-z0-9]{24,}$/;

const validateSendMessage = (data) => {
  const sendMessageSchema = Joi.object({
    type: Joi.string().valid("TEXT", "FILE").required(),
    content: Joi.string().min(1).required(),
    conversationId: Joi.string().required().pattern(cuidPattern),
    userId: Joi.string().required().pattern(cuidPattern),
  });

  const { error, value } = sendMessageSchema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return value;
};

const validataGetMessagesConversationById = (data) => {
  const getMessagesConvsersationByIdSchema = Joi.object({
    conversationId: Joi.string().required().pattern(cuidPattern),
  });

  const { error, value } = getMessagesConvsersationByIdSchema.validate(data);

  if (error) {
    throw new Error(error.details[0].message);
  }

  return value;
};

const validateDeleteMessage = (data) => {
  const deleteMessage = Joi.object({
    messageId: Joi.number().integer().required(),
  });

  const { error, value } = deleteMessage.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return value;
};

module.exports = {
  validateSendMessage,
  validataGetMessagesConversationById,
  validateDeleteMessage,
};
