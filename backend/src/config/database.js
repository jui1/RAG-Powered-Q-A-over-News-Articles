import { createClient } from 'redis';

let redisClient = null;
let redisConnected = false;
let connectionAttempted = false;

export async function getRedisClient() {
  if (connectionAttempted && !redisConnected) {
    throw new Error('Redis is not connected');
  }
  
  if (!redisClient && !connectionAttempted) {
    connectionAttempted = true;
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: false
      }
    });

    redisClient.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED') {
        console.error('Redis Client Error:', err.message);
      }
      redisConnected = false;
    });
    
    redisClient.on('connect', () => {
      console.log('✓ Redis Client Connected');
      redisConnected = true;
    });

    try {
      await redisClient.connect();
      redisConnected = true;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.warn('⚠ Redis not available. Using in-memory storage for sessions.');
        console.warn('   Sessions will not persist across server restarts.');
      } else {
        console.error('Failed to connect to Redis:', error.message);
      }
      redisConnected = false;
      redisClient = null;
    }
  }
  
  if (!redisConnected) {
    throw new Error('Redis is not connected');
  }
  
  return redisClient;
}

export function isRedisConnected() {
  return redisConnected;
}

export default getRedisClient;

