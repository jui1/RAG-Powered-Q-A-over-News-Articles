import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('chat:message', async (data) => {
    try {
      const { query, sessionId } = data;
      
      if (!query) {
        socket.emit('chat:error', { error: 'Query is required' });
        return;
      }
      
      const { getRAGStreamingResponse } = await import('./services/rag.js');
      const { getChatHistory, addMessage, generateSessionId, extendSessionTTL } = await import('./services/session.js');
      
      let currentSessionId = sessionId || generateSessionId();
      await extendSessionTTL(currentSessionId);
      const chatHistory = await getChatHistory(currentSessionId);
      
      await addMessage(currentSessionId, 'user', query);
      
      socket.emit('chat:sessionId', { sessionId: currentSessionId });
      
      const { response, sources } = await getRAGStreamingResponse(
        query,
        currentSessionId,
        chatHistory,
        (chunk) => {
          socket.emit('chat:chunk', { chunk });
        }
      );
      
      await addMessage(currentSessionId, 'assistant', response);
      
      socket.emit('chat:done', { sources });
    } catch (error) {
      console.error('Socket error:', error);
      socket.emit('chat:error', { error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});


