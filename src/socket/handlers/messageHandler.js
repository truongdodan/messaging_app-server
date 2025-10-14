const messageService = require("../../services/messageService");
const {
  validateSendMessage,
  validateDeleteMessage,
} = require("../../validators/messageValidator");
const socketEvents = require("../../constants/socketEvents");

module.exports = async (io, socket) => {
  // Send message in a chat
  socket.on(socketEvents.SEND_MESSAGE, async (data, callback) => {
    try {
      const { type, content, conversationId } = validateSendMessage(data);

      // Save message to database
      const newMessage = await messageService.createMessage({
        type,
        content,
        userId: socket.userId,
        conversationId,
      });

      // return new message
      if (callback) {
        callback({ success: true, data: newConversation });
      }
    } catch (error) {
      if (callback) {
        callback({ success: false, error: "Failed to create conversation" });
      }
      console.error("Error sending message:", error);
      socketEmitter.emitError(socketEvents.ERROR, "Failed to send message");
    }
  });

  socket.on(socketEvents.DELETE_MESSAGE, async (data) => {
    try {
      const { messageId } = validateDeleteMessage(data);

      // Delete message
      await messageService.deleteMessage({
        messageId,
        userId: socket.userId,
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      socketEmitter.emitError(socketEvents.ERROR, "Failed to delete message");
    }
  });
};
