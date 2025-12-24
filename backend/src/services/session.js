import getRedisClient, { isRedisConnected } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const SESSION_TTL = 86400;
const CHAT_HISTORY_KEY_PREFIX = 'chat:session:';

const inMemoryStore = new Map();

export function generateSessionId() {
  return uuidv4();
}

export async function getChatHistory(sessionId) {
  try {
    if (isRedisConnected()) {
      const redisClient = await getRedisClient();
      const key = `${CHAT_HISTORY_KEY_PREFIX}${sessionId}`;
      const history = await redisClient.get(key);
      return history ? JSON.parse(history) : [];
    } else {
      return inMemoryStore.get(sessionId) || [];
    }
  } catch (error) {
    console.error('Error getting chat history:', error);
    return inMemoryStore.get(sessionId) || [];
  }
}

export async function addMessage(sessionId, role, content) {
  try {
    const history = await getChatHistory(sessionId);
    
    history.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    
    if (isRedisConnected()) {
      const redisClient = await getRedisClient();
      const key = `${CHAT_HISTORY_KEY_PREFIX}${sessionId}`;
      await redisClient.setEx(key, SESSION_TTL, JSON.stringify(history));
    } else {
      inMemoryStore.set(sessionId, history);
    }
    
    return history;
  } catch (error) {
    console.error('Error adding message:', error);
    const history = inMemoryStore.get(sessionId) || [];
    history.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    inMemoryStore.set(sessionId, history);
    return history;
  }
}

export async function clearSession(sessionId) {
  try {
    if (isRedisConnected()) {
      const redisClient = await getRedisClient();
      const key = `${CHAT_HISTORY_KEY_PREFIX}${sessionId}`;
      await redisClient.del(key);
    } else {
      inMemoryStore.delete(sessionId);
    }
    return true;
  } catch (error) {
    console.error('Error clearing session:', error);
    inMemoryStore.delete(sessionId);
    return true;
  }
}

export async function extendSessionTTL(sessionId) {
  try {
    if (isRedisConnected()) {
      const redisClient = await getRedisClient();
      const key = `${CHAT_HISTORY_KEY_PREFIX}${sessionId}`;
      await redisClient.expire(key, SESSION_TTL);
    }
  } catch (error) {
    console.error('Error extending session TTL:', error);
  }
}

