let ioInstance = null;

module.exports = {
  setIO(io) {
    ioInstance = io;
  },

  getIO() {
    if (!ioInstance) {
      throw new Error("Socket.IO not initialized");
    }
    return ioInstance;
  },

  emitToConversation(conversationId, event, data) {
    this.getIO().to(`conversation_${conversationId}`).emit(event, data);
  },
};
