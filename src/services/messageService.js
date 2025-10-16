const socketEvents = require("../constants/socketEvents");
const { prisma } = require("../lib/prisma");
const messageRepository = require("../repositories/messageRepository");
const fileService = require("../services/fileService");
const socketEmitter = require("../utils/socketEmitter");

// Helper: Attach URLs to messages
async function attachUrlsToMessages(messages) {
  return Promise.all(
    messages.map(async (msg) => {
      try {
        // Attach sender profile URL (public)
        if (msg.sender?.profileUrl) {
          msg.sender.profileUrl = fileService.getPublicUrl(
            msg.sender.profileUrl
          );
        }

        // Attach file URL (private - signed)
        if (msg.type === "FILE") {
          const fileDetails = JSON.parse(msg.content);
          const { signedUrl } = await fileService.getSignedUrl(
            fileDetails.path
          );

          msg.content = JSON.stringify({
            ...fileDetails,
            url: signedUrl, // Add signed URL
          });
        }
      } catch (error) {
        console.error("Error attaching URLs to message:", error);
      }

      return msg;
    })
  );
}

module.exports = {
  // When user send Normal text
  async createMessage(data) {
    // Verify user is member of this chat
    const memberCheck = await prisma.conversation.findFirst({
      where: {
        id: data.conversationId,
        participants: { some: { user: { id: data.userId } } },
      },
    });

    if (!memberCheck) {
      throw new Error("Not a member of this chat");
    }

    // Create message in db
    const newMessage = await messageRepository.create(data);

    // Attach URLs
    const [messageWithURLs] = await attachUrlsToMessages([newMessage]);

    // Broadcast to all user in conversation
    socketEmitter.emitToConversation(
      data.conversationId,
      socketEvents.NEW_MESSAGE,
      messageWithURLs
    );

    return messageWithURLs;
  },
  // When user send image or file
  async createFileMessage(data) {
    const { file, userId, conversationId } = data;
    // Verify user is member of this chat
    const memberCheck = await prisma.conversation.findFirst({
      where: {
        id: data.conversationId,
        participants: { some: { user: { id: data.userId } } },
      },
    });

    if (!memberCheck) {
      throw new Error("Not a member of this chat");
    }

    // Upload file to cloud (Supabase)
    const fileData = await fileService.uploadFile(file);

    // Prepare data for new message
    const fileDetails = {
      path: fileData.path,
      filename: file.originalname,
      mimetype: file.mimetype,
    };

    // Create message with file infor
    const newMessage = await messageRepository.create({
      type: "FILE",
      content: JSON.stringify(fileDetails),
      userId,
      conversationId,
    });

    // Attach URLs
    const [messageWithURLs] = await attachUrlsToMessages([newMessage]);

    // Broadcast to all user in conversation
    socketEmitter.emitToConversation(
      conversationId,
      socketEvents.NEW_MESSAGE,
      messageWithURLs
    );

    return messageWithURLs;
  },
  async getMessages(data) {
    const messages = await messageRepository.get({
      conversationId: data.conversationId,
    });

    // Attach file url
    return await attachUrlsToMessages(messages);
  },
  async deleteMessage(data) {
    const { deleteFile } = require("./fileService");

    // Get message details
    const message = await prisma.message.findUnique({
      where: { id: data.messageId },
      select: {
        type: true,
        content: true,
        conversationId: true,
        sender: { select: { id: true } },
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    // Verify user is sender
    if (message.sender.id !== data.userId) {
      throw new Error("Unauthorized");
    }

    // Delete file if message type is FILE
    if (message.type === "FILE") {
      try {
        const fileDetails = JSON.parse(message.content);
        await deleteFile(fileDetails.path);
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }

    // Delete message from DB
    const deletedMessage = await messageRepository.delete(data.messageId);

    // Broadcast
    socketEmitter.emitToConversation(
      message.conversationId,
      socketEvents.REMOVED_MESSAGE,
      { messageId: data.messageId }
    );

    return deletedMessage;
  },
};
