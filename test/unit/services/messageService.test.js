const messageService = require("../../../src/services/messageService");
const { prisma } = require("../../../src/lib/prisma");
const messageRepository = require("../../../src/repositories/messageRepository");
const socketEmitter = require("../../../src/utils/socketEmitter");
const socketEvents = require("../../../src/constants/socketEvents");

// Mock all dependencies
jest.mock("../../../src/lib/prisma", () => ({
  prisma: {
    conversation: {
      findFirst: jest.fn(),
    },
    message: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../src/repositories/messageRepository");
jest.mock("../../../src/utils/socketEmitter");

// Mock file service (needed for file operations)
jest.mock("../../../src/services/fileService", () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
}));

describe("Message Service Unit Tests", () => {
  const mockUserId = "c123456789012345678901234";
  const mockConversationId = "c987654321098765432109876";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createMessage", () => {
    test("Should create message when user is member", async () => {
      // Setup: Mock user is member of conversation
      prisma.conversation.findFirst.mockResolvedValue({
        id: mockConversationId,
      });

      // Setup: Mock message creation
      const mockMessage = {
        id: 1,
        type: "TEXT",
        content: "Test message",
        sender: { id: mockUserId, username: "testuser" },
        conversationId: mockConversationId,
        createdAt: new Date(),
      };
      messageRepository.create.mockResolvedValue(mockMessage);

      // Setup: Mock socket emitter (doesn't return anything)
      socketEmitter.emitToConversation.mockReturnValue(undefined);

      // Execute
      const result = await messageService.createMessage({
        type: "TEXT",
        content: "Test message",
        userId: mockUserId,
        conversationId: mockConversationId,
      });

      // Verify: Message was created
      expect(result).toEqual(mockMessage);

      // Verify: Membership was checked
      expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockConversationId,
          participants: { some: { user: { id: mockUserId } } },
        },
      });

      // Verify: Repository was called
      expect(messageRepository.create).toHaveBeenCalledWith({
        type: "TEXT",
        content: "Test message",
        userId: mockUserId,
        conversationId: mockConversationId,
      });

      // Verify: Socket emitter was called (real-time broadcast)
      expect(socketEmitter.emitToConversation).toHaveBeenCalledWith(
        mockConversationId,
        socketEvents.NEW_MESSAGE,
        mockMessage,
      );
    });

    test("Should throw error when user is not member", async () => {
      // Setup: Mock user is NOT member (returns null)
      prisma.conversation.findFirst.mockResolvedValue(null);

      // Execute & Verify: Should throw error
      await expect(
        messageService.createMessage({
          type: "TEXT",
          content: "Test message",
          userId: mockUserId,
          conversationId: mockConversationId,
        }),
      ).rejects.toThrow("Not a member of this chat");

      // Verify: Repository was NOT called (failed before that)
      expect(messageRepository.create).not.toHaveBeenCalled();
      expect(socketEmitter.emitToConversation).not.toHaveBeenCalled();
    });
  });

  describe("createFileMessage", () => {
    test("Should upload file and create FILE message when user is member", async () => {
      const fileService = require("../../../src/services/fileService");

      // Setup: Mock user is member
      prisma.conversation.findFirst.mockResolvedValue({
        id: mockConversationId,
      });

      // Setup: Mock file upload
      fileService.uploadFile.mockResolvedValue({
        path: "uploads/123456.jpg",
      });

      // Setup: Mock file object
      const mockFile = {
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake image data"),
      };

      // Setup: Mock message creation
      const mockFileMessage = {
        id: 1,
        type: "FILE",
        content: JSON.stringify({
          path: "uploads/123456.jpg",
          filename: "test.jpg",
          mimetype: "image/jpeg",
        }),
        conversationId: mockConversationId,
        createdAt: new Date(),
      };
      messageRepository.create.mockResolvedValue(mockFileMessage);
      socketEmitter.emitToConversation.mockReturnValue(undefined);

      // Execute
      const result = await messageService.createFileMessage({
        file: mockFile,
        userId: mockUserId,
        conversationId: mockConversationId,
      });

      // Verify: Membership was checked
      expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockConversationId,
          participants: { some: { user: { id: mockUserId } } },
        },
      });

      // Verify: File was uploaded to cloud
      expect(fileService.uploadFile).toHaveBeenCalledWith(mockFile);

      // Verify: Message was created with file details
      expect(messageRepository.create).toHaveBeenCalledWith({
        type: "FILE",
        content: JSON.stringify({
          path: "uploads/123456.jpg",
          filename: "test.jpg",
          mimetype: "image/jpeg",
        }),
        userId: mockUserId,
        conversationId: mockConversationId,
      });

      // Verify: Socket event was emitted
      expect(socketEmitter.emitToConversation).toHaveBeenCalledWith(
        mockConversationId,
        socketEvents.NEW_MESSAGE,
        mockFileMessage,
      );

      // Verify: Result is correct
      expect(result).toEqual(mockFileMessage);
    });

    test("Should throw error when user is not member", async () => {
      // Setup: Mock user is NOT member
      prisma.conversation.findFirst.mockResolvedValue(null);

      const mockFile = {
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("fake image data"),
      };

      // Execute & Verify: Should throw error
      await expect(
        messageService.createFileMessage({
          file: mockFile,
          userId: mockUserId,
          conversationId: mockConversationId,
        }),
      ).rejects.toThrow("Not a member of this chat");

      // Verify: File was NOT uploaded
      const fileService = require("../../../src/services/fileService");
      expect(fileService.uploadFile).not.toHaveBeenCalled();
      expect(messageRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getMessages", () => {
    test("Should get messages for conversation", async () => {
      // Setup: Mock messages from repository
      const mockMessages = {
        id: mockConversationId,
        messages: [
          { id: 1, content: "Message 1", type: "TEXT" },
          { id: 2, content: "Message 2", type: "TEXT" },
        ],
      };

      messageRepository.get.mockResolvedValue(mockMessages);

      // Execute
      const result = await messageService.getMessages(mockConversationId);

      // Verify: Repository was called with correct ID
      expect(messageRepository.get).toHaveBeenCalledWith(mockConversationId);

      // Verify: Result is correct
      expect(result).toEqual(mockMessages);
    });
  });

  describe("deleteMessage", () => {
    test("Should delete TEXT message when user is sender", async () => {
      const messageId = 123;

      // Setup: Mock finding the TEXT message
      prisma.message.findUnique.mockResolvedValue({
        id: messageId,
        type: "TEXT",
        content: "Message to delete",
        conversationId: mockConversationId,
        sender: { id: mockUserId },
      });

      // Setup: Mock repository delete
      messageRepository.delete.mockResolvedValue(undefined);
      socketEmitter.emitToConversation.mockReturnValue(undefined);

      // Execute
      await messageService.deleteMessage({
        messageId,
        userId: mockUserId,
      });

      // Verify: Message was found
      expect(prisma.message.findUnique).toHaveBeenCalledWith({
        where: { id: messageId },
        select: {
          type: true,
          content: true,
          conversationId: true,
          sender: { select: { id: true } },
        },
      });

      // Verify: Message was deleted from DB
      expect(messageRepository.delete).toHaveBeenCalledWith(messageId);

      // Verify: Socket event was emitted
      expect(socketEmitter.emitToConversation).toHaveBeenCalledWith(
        mockConversationId,
        socketEvents.REMOVED_MESSAGE,
        { messageId },
      );
    });

    test("Should delete FILE message and remove file from storage", async () => {
      const messageId = 456;
      const fileService = require("../../../src/services/fileService");

      // Setup: Mock finding FILE message
      prisma.message.findUnique.mockResolvedValue({
        id: messageId,
        type: "FILE",
        content: JSON.stringify({
          path: "uploads/test-file.jpg",
          filename: "test-file.jpg",
          mimetype: "image/jpeg",
        }),
        conversationId: mockConversationId,
        sender: { id: mockUserId },
      });

      // Setup: Mock file deletion
      fileService.deleteFile.mockResolvedValue(undefined);
      messageRepository.delete.mockResolvedValue(undefined);
      socketEmitter.emitToConversation.mockReturnValue(undefined);

      // Execute
      await messageService.deleteMessage({
        messageId,
        userId: mockUserId,
      });

      // Verify: File was deleted from cloud storage
      expect(fileService.deleteFile).toHaveBeenCalledWith(
        "uploads/test-file.jpg",
      );

      // Verify: Message was deleted from DB
      expect(messageRepository.delete).toHaveBeenCalledWith(messageId);

      // Verify: Socket event was emitted
      expect(socketEmitter.emitToConversation).toHaveBeenCalledWith(
        mockConversationId,
        socketEvents.REMOVED_MESSAGE,
        { messageId },
      );
    });

    test("Should throw error when message not found", async () => {
      const messageId = 999;

      // Setup: Message doesn't exist
      prisma.message.findUnique.mockResolvedValue(null);

      // Execute & Verify: Should throw error
      await expect(
        messageService.deleteMessage({
          messageId,
          userId: mockUserId,
        }),
      ).rejects.toThrow("Message not found");

      // Verify: Repository delete was NOT called
      expect(messageRepository.delete).not.toHaveBeenCalled();
      expect(socketEmitter.emitToConversation).not.toHaveBeenCalled();
    });

    test("Should throw error when user is not the sender", async () => {
      const messageId = 123;
      const differentUserId = "c999999999999999999999999";

      // Setup: Mock finding message with different sender
      prisma.message.findUnique.mockResolvedValue({
        id: messageId,
        type: "TEXT",
        content: "Someone else's message",
        sender: { id: differentUserId }, // Different user!
        conversationId: mockConversationId,
      });

      // Execute & Verify: Should throw error
      await expect(
        messageService.deleteMessage({
          messageId,
          userId: mockUserId, // Current user is NOT the sender
        }),
      ).rejects.toThrow("Unauthorized");

      // Verify: Repository delete was NOT called
      expect(messageRepository.delete).not.toHaveBeenCalled();
      expect(socketEmitter.emitToConversation).not.toHaveBeenCalled();
    });

    test("Should still delete message if file deletion fails", async () => {
      const messageId = 789;
      const fileService = require("../../../src/services/fileService");

      // Setup: Mock FILE message
      prisma.message.findUnique.mockResolvedValue({
        id: messageId,
        type: "FILE",
        content: JSON.stringify({
          path: "uploads/missing-file.jpg",
          filename: "missing-file.jpg",
          mimetype: "image/jpeg",
        }),
        conversationId: mockConversationId,
        sender: { id: mockUserId },
      });

      // Setup: Mock file deletion FAILS
      fileService.deleteFile.mockRejectedValue(
        new Error("File not found in storage"),
      );
      messageRepository.delete.mockResolvedValue(undefined);
      socketEmitter.emitToConversation.mockReturnValue(undefined);

      // Execute - should NOT throw error
      await messageService.deleteMessage({
        messageId,
        userId: mockUserId,
      });

      // Verify: File deletion was attempted
      expect(fileService.deleteFile).toHaveBeenCalled();

      // Verify: Message was STILL deleted from DB (graceful failure)
      expect(messageRepository.delete).toHaveBeenCalledWith(messageId);

      // Verify: Socket event was STILL emitted
      expect(socketEmitter.emitToConversation).toHaveBeenCalledWith(
        mockConversationId,
        socketEvents.REMOVED_MESSAGE,
        { messageId },
      );
    });
  });
});
