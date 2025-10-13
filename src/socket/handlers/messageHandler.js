const messageService = require("../../services/messageService");
const {
  validateSendMessage,
  validateDeleteMessage,
} = require("../../validators/messageValidator");
const socketEvents = require("../../constants/socketEvents");

module.exports = async (io, socket) => {
  // Send message in a chat
  socket.on(socketEvents.SEND_MESSAGE, async (data) => {
    try {
      const { type, content, conversationId } = validateSendMessage(data);

      // Save message to database
      await messageService.createMessage({
        type,
        content,
        userId: socket.userId,
        conversationId,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
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
      socket.emit("error", { message: "Failed to delete message" });
    }
  });
};
