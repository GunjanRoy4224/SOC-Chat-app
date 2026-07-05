import localforage from 'localforage';

// Initialize instances for different types of local data
const messagesStore = localforage.createInstance({
  name: 'PulseDB',
  storeName: 'messages'
});

const chatsStore = localforage.createInstance({
  name: 'PulseDB',
  storeName: 'chats'
});

/**
 * Save decrypted messages to local storage.
 * @param {string} roomId 
 * @param {Array} messages 
 */
export async function saveLocalMessages(roomId, messages) {
  try {
    await messagesStore.setItem(`room_${roomId}`, messages);
  } catch (err) {
    console.error("Failed to save messages locally:", err);
  }
}

/**
 * Load decrypted messages from local storage.
 * @param {string} roomId 
 * @returns {Array|null}
 */
export async function getLocalMessages(roomId) {
  try {
    return await messagesStore.getItem(`room_${roomId}`);
  } catch (err) {
    console.error("Failed to get local messages:", err);
    return null;
  }
}

/**
 * Save chat list locally.
 */
export async function saveLocalChats(chats) {
  try {
    await chatsStore.setItem('chat_list', chats);
  } catch (err) {
    console.error("Failed to save chats locally:", err);
  }
}

/**
 * Load chat list locally.
 */
export async function getLocalChats() {
  try {
    return await chatsStore.getItem('chat_list');
  } catch (err) {
    console.error("Failed to get local chats:", err);
    return null;
  }
}
