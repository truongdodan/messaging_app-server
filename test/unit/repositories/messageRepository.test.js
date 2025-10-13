const messageRepository = require("../../../src/repositories/messageRepository");
const { prisma } = require("../../../src/lib/prisma");

// MOCK Prisma - replace real database calls with fake ones
jest.mock("../../../src/lib/prisma", () => ({
  prisma: {
    message: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
    },
  },
}));

describe("Message Ropository Unit Tests", () => {
  // Reset mocks
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    test("Should create message with correct data", async () => {
      const mockMessage = {
        id: 1,
        type: "TEXT",
        content: "Test message",
        createdAt: new Date(),
        sender: {
          id: "c123456789012345678901234",
          username: "testuser",
          profileUrl: null,
        },
        conversationId: "c987654321098765432109876",
      };

      prisma.message.create.mockResolvedValue(mockMessage);

      // Execute
      const result = await messageRepository.create({
        type: "TEXT",
        content: "Test message",
        userId: "c123456789012345678901234",
        conversationId: "c987654321098765432109876",
      });

      // Verify result
      expect(result).toEqual(mockMessage);

      // Verify that Prisma was called correctly
      expect(prisma.message.create).toHaveBeenCalledTimes(1);
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          type: "TEXT",
          content: "Test message",
          sender: { connect: { id: "c123456789012345678901234" } },
          conversation: { connect: { id: "c987654321098765432109876" } },
        },
        select: expect.any(Object), // We don't care about exact select structure
      });
    });
  });

  describe("delete", () => {
    test("Should delete message by id", async () => {
      // Setup: doesn't return anything
      prisma.message.delete.mockResolvedValue(undefined);

      // Execute
      await messageRepository.delete(123);

      // Verify
      expect(prisma.message.delete).toHaveBeenCalledTimes(1);
      expect(prisma.message.delete).toHaveBeenCalledWith({
        where: { id: 123 },
      });
    });
  });

  describe("get", () => {
    test("Should get conversation with messages", async () => {
      const mockConversation = {
        id: "c987654321098765432109876",
        type: "PRIVATE",
        messages: [
          { id: 1, content: "Message 1", type: "TEXT" },
          { id: 2, content: "Message 2", type: "TEXT" },
        ],
        participants: [],
      };

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await messageRepository.get({
        conversationId: "c987654321098765432109876",
        userId: "c123456789012345678901234",
      });

      expect(result).toEqual(mockConversation);
      expect(prisma.conversation.findUnique).toHaveBeenCalledTimes(1);
    });
  });
});
