module.exports = {
  // Messages - Client to Server
  SEND_MESSAGE: "send_message",
  DELETE_MESSAGE: "delete_message",

  // Messages - Server to Client
  NEW_MESSAGE: "new_message",
  REMOVED_MESSAGE: "removed_message",

  // Conversation - Client to Server
  JOIN_CONVERSATIONS: "join_conversations",
  CREATE_CONVERSATION: "create_conversation",

  // Conversation - Server to Client
  NEW_CONVERSATION: "new_conversation",

  // User presence - Server to Client
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  ONLINE_USERS_LIST: "online_users_list",

  // Errors
  ERROR: "error",
};
