const {
  validataGetMessagesConversationById,
  validateDeleteMessage,
  validateSendMessage,
} = require("../../../src/validators/messageValidator");

describe("Message Validator Unit Tests", () => {
  // Test successful validation
  describe("validateSendMessage", () => {
    test("Should accept valid message data", () => {
      const validData = {
        type: "TEXT",
        content: "Hello world",
        conversationId: "c123456789012345678901234",
        userId: "c987654321098765432109876",
      };

      // Should NOT throw error
      expect(() => validateSendMessage(validData)).not.toThrow();

      // Should return the validated data
      const result = validateSendMessage(validData);
      expect(result.content).toBe("Hello world");
    });

    test("Should reject empty content", () => {
      const emptyContentData = {
        type: "TEXT",
        content: "", // Empty content
        conversationId: "c123456789012345678901234",
        userId: "c987654321098765432109876",
      };

      // Should THROW error about content
      expect(() => validateSendMessage(emptyContentData)).toThrow();
    });

    test("Should reject invalid type", () => {
      const invalidTypeData = {
        type: "INVALID_TYPE", // Only TEXT or FILE allowd
        content: "Hello world",
        conversationId: "c123456789012345678901234",
        userId: "c987654321098765432109876",
      };

      // Should throw error about type
      expect(() => validateSendMessage(invalidTypeData)).toThrow();
    });

    test("Should reject invalid conversationId format", () => {
      const invalidConversatioIdFormatData = {
        type: "TEXT",
        content: "Hello world",
        conversationId: "invalid_id", // Wrong format (not CUID)
        userId: "c987654321098765432109876",
      };

      // Should throw error about in valid conversationId
      expect(() =>
        validateSendMessage(invalidConversatioIdFormatData),
      ).toThrow();
    });
  });

  describe("validateDeleteMessage", () => {
    test("Should accept valid delete data", () => {
      const validData = {
        messageId: 12345,
      };

      expect(() => validateDeleteMessage(validData)).not.toThrow();
    });

    test("Should reject missing messageId", () => {
      const invalidData = {};

      expect(() => validateDeleteMessage(invalidData)).toThrow();
    });

    test("Should reject string number", () => {
      const invalidData = {
        messageId: "invalid_number",
      };

      expect(() => validateDeleteMessage(invalidData)).toThrow();
    });
  });

  describe("validataGetMessagesConversationById", () => {
    test("Should accept valid conversationId", () => {
      const validData = {
        conversationId: "c123456789012345678901234",
      };

      expect(() =>
        validataGetMessagesConversationById(validData),
      ).not.toThrow();
    });

    test("Should reject invalid conversationId", () => {
      const invalidData = {
        conversationId: "abc333",
      };

      expect(() => validataGetMessagesConversationById(invalidData)).toThrow();
    });
  });
});
