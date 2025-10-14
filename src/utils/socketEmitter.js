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

  emitError(name, message) {
    this.getIO().emit(name, { message });
  },

  emitToConversation(conversationId, event, data) {
    this.getIO().to(`conversation_${conversationId}`).emit(event, data);
  },

  emitToUser(userId, event, data) {
    this.getIO().to(`user_${userId}`).emit(event, data);
  },

  joinConversationRoom(userId, conversationId) {
    const io = this.getIO();
    const userSockets = Array.from(io.sockets.sockets.values()).filter(
      (socket) => socket.userId === userId,
    );
    userSockets.forEach((socket) =>
      socket.join(`conversation_${conversationId}`),
    );
  },

  emitToMultipleUsers(userIds, event, data) {
    userIds.forEach((userId) => this.emitToUser(userId, event, data));
  },
};
