const socketEvents = require("../constants/socketEvents");
const conversationRepository = require("../repositories/conversationRepository");
const socketEmitter = require("../utils/socketEmitter");
const fileService = require("./fileService");

const attachUrlsToConversation = async (conversations) => {
  return Promise.all(
    conversations.map(async (conv) => {
      try {
        // GROUP: attach group profile URL
        if (conv.type === "GROUP" && conv.profileUrl) {
          conv.profileUrl = fileService.getPublicUrl(conv.profileUrl);
        }

        // DIRECT: attach participant profile URL
        if (conv.type === "DIRECT" && conv.participants?.length > 0) {
          const otherPerson = conv.participants[0];

          if (otherPerson?.user?.profileUrl) {
            otherPerson.user.profileUrl = fileService.getPublicUrl(
              otherPerson.user.profileUrl
            );
          }

          // Set conversation-level display infor
          conv.profileUrl = otherPerson.user.profileUrl || "/user.png";
          conv.title =
            otherPerson.user.firstname + " " + otherPerson.user.lastname;
        }
      } catch (error) {
        console.error("Error attaching URLs to conversation:", error);
        // Return conversation with placeholder if URL fetch fails
        if (conv.type === "GROUP") conv.profileUrl = "/user.png";
        if (conv.type === "DIRECT") {
          conv.profileUrl = "/user.png";
          conv.title = "Unknown User";
        }
      }

      return conv;
    })
  );
};

module.exports = {
  async getConversations(data) {
    const conversations = await conversationRepository.get({
      ...(data.type && { type: data.type }),
      userId: data.userId,
    });

    return await attachUrlsToConversation(conversations);
  },

  async createConversation(data) {
    // Add currently login user to memberlist
    data.allMemberIds.push(data.userId);

    // Create new conversation
    const newConversation = await conversationRepository.create(data);

    // Attach URL
    const [conversationWithUrls] = await attachUrlsToConversation([
      newConversation,
    ]);

    // Broadcast to all members
    // Make all online members join the socket room
    data.allMemberIds.forEach((memberId) => {
      socketEmitter.emitToUser(
        memberId,
        socketEvents.NEW_CONVERSATION,
        conversationWithUrls
      );
      socketEmitter.joinConversationRoom(memberId, newConversation.id);
    });

    return conversationWithUrls;
  },
};
