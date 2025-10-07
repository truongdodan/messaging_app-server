const onlineUsers = new Map();

module.exports = {
  /* Add new device/socket for a user */
  addUserSocket: (userId, socketId) => {
    if (!onlineUsers.has(userId)) {
      // first device connecting - create new set
      onlineUsers.set(userId, new Set());
    }

    // add this socket to user device list
    onlineUsers.get(userId).add(socketId);

    // return true if this was an user first device
    return onlineUsers.get(userId).size === 1;
  },

  /* Remove device/socket when it disconnect */
  removeUserSocket: (userId, socketId) => {
    if (!onlineUsers.has(userId)) return false;

    onlineUsers.get(userId).delete(socketId);

    if (onlineUsers.get(userId).size === 0) {
      onlineUsers.delete(userId);
      return true; // User went fully offline
    }

    return false; // User still has other device connected
  },

  /* Check if user is online on any device */
  isUserOnline: (userId) => {
    return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
  },

  /* Get all online user IDs */
  getOnlineUserIds: () => {
    return Array.from(onlineUsers.keys());
  },

  getUserDeviceCount: (userId) => {
    return onlineUsers.has(userId) ? onlineUsers.get(userId).size : 0;
  },
};
