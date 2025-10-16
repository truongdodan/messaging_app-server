const Joi = require("joi");

const cuidPattern = /^c[a-z0-9]{24,}$/;

const validateGetConversation = (data) => {
  const getConversationSchema = Joi.object({
    type: Joi.string().valid("DIRECT", "GROUP", "GLOBAL").optional(),
  });

  const { error, value } = getConversationSchema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return value;
};

const validateCreateConversation = (data) => {
  const createConversationSchema = Joi.object({
    title: Joi.string().allow("").optional(),
    type: Joi.string().valid("DIRECT", "GROUP").optional(),
    profileUrl: Joi.string().allow("").optional(),
    allMemberIds: Joi.array().items(Joi.string()).required().default([]),
  });

  const { error, value } = createConversationSchema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return value;
};

module.exports = {
  validateGetConversation,
  validateCreateConversation,
};
