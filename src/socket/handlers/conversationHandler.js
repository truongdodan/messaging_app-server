const socketEvents = require("../../constants/socketEvents");
const { prisma, Prisma } = require("../../lib/prisma");
const conversationService = require("../../services/conversationService");
const socketEmitter = require("../../utils/socketEmitter");
const {
  validateCreateConversation,
} = require("../../validators/conversationValidator");

const chatHandler = (io, socket) => {
  // Join all conversations when user connects
  socket.on(socketEvents.JOIN_CONVERSATIONS, async () => {
    try {
      // find all conversation this user is a member of
      // if conversation is DIRECT return other person infor, else return only conversation infor
      const userConversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: { user: { id: socket.userId } },
          },
        },
        select: { id: true },
      });

      // Join all chat rooms
      userConversations.forEach((conversation) => {
        socket.join(`conversation_${conversation.id}`);
      });
    } catch (error) {
      console.error("Error joining conversations:", error);
      socketEmitter.emitError(
        socketEvents.ERROR,
        "Failed to join conversations",
      );
    }
  });

  // Create new chat
  socket.on(socketEvents.CREATE_CONVERSATION, async (data, callback) => {
    try {
      const {
        title,
        type,
        profileUrl,
        allMemberIds = [],
      } = validateCreateConversation(data); // type: 'DIRECT' or 'GROUP'

      // Create chat
      const newConversation = await conversationService.createConversation({
        title,
        type,
        profileUrl,
        allMemberIds,
        userId: socket.userId,
      });

      // return new conversation
      if (callback) {
        callback({ success: true, data: newConversation });
      }
    } catch (error) {
      if (callback) {
        callback({ success: false, error: "Failed to create conversation" });
      }
      console.error("Error creating conversation:", error);
      socketEmitter.emitError(
        socketEvents.ERROR,
        "Failed to create conversation",
      );
    }
  });
};

module.exports = chatHandler;
