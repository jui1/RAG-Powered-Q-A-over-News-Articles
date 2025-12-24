import express from 'express';
import { getRAGResponse, getRAGStreamingResponse } from '../services/rag.js';
import { getChatHistory, addMessage, clearSession, generateSessionId, extendSessionTTL } from '../services/session.js';

const router = express.Router();

router.post('/message', async (req, res) => {
  try {
    const { query, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
    }
    
    await extendSessionTTL(currentSessionId);
    const chatHistory = await getChatHistory(currentSessionId);
    
    await addMessage(currentSessionId, 'user', query);
    
    const { response, sources } = await getRAGResponse(query, currentSessionId, chatHistory);
    
    await addMessage(currentSessionId, 'assistant', response);
    
    res.json({
      sessionId: currentSessionId,
      response,
      sources
    });
  } catch (error) {
    console.error('Error in /message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/message/stream', async (req, res) => {
  try {
    const { query, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
    }
    
    await extendSessionTTL(currentSessionId);
    const chatHistory = await getChatHistory(currentSessionId);
    
    await addMessage(currentSessionId, 'user', query);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let fullResponse = '';
    
    const { response, sources } = await getRAGStreamingResponse(
      query,
      currentSessionId,
      chatHistory,
      (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk, type: 'chunk' })}\n\n`);
      }
    );
    
    await addMessage(currentSessionId, 'assistant', response);
    
    res.write(`data: ${JSON.stringify({ type: 'done', sources })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error in /message/stream:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await getChatHistory(sessionId);
    res.json({ sessionId, history });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await clearSession(sessionId);
    res.json({ success: true, message: 'Session cleared' });
  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/session', (req, res) => {
  const sessionId = generateSessionId();
  res.json({ sessionId });
});

export default router;


