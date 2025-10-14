const socketEvents = require("../constants/socketEvents");
const conversationRepository = require("../repositories/conversationRepository");
const socketEmitter = require("../utils/socketEmitter");

module.exports = {
  async getConversation(data) {
    return await conversationRepository.get({
      ...(data.type && { type: data.type }),
      userId: data.userId,
    });
  },

  async createConversation(data) {
    // Add currently login user to memberlist
    data.allMemberIds.push(data.userId);

    // Create new conversation
    const newConversation = await conversationRepository.create(data);

    // Broadcast to all members
    // Make all online members join the socket room
    data.allMemberIds.forEach((memberId) => {
      socketEmitter.emitToUser(
        memberId,
        socketEvents.NEW_CONVERSATION,
        newConversation,
      );
      socketEmitter.joinConversationRoom(memberId, newConversation.id);
    });

    return newConversation;
  },
};
