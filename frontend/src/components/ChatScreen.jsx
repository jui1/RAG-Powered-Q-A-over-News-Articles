import { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import { sendMessage, sendStreamingMessage, fetchHistory, clearSession } from '../services/api';
import { io } from 'socket.io-client';

function ChatScreen({ sessionId, onNewSession, apiBaseUrl }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [sources, setSources] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadHistory();
    
    socketRef.current = io(apiBaseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.warn('WebSocket connection error:', error.message);
      console.log('Falling back to REST API for chat');
    });

    socketRef.current.on('chat:sessionId', (data) => {
      if (data.sessionId && data.sessionId !== sessionId) {
        onNewSession();
      }
    });

    socketRef.current.on('chat:chunk', (data) => {
      setCurrentStreamingMessage(prev => prev + data.chunk);
    });

    socketRef.current.on('chat:done', (data) => {
      if (currentStreamingMessage) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: currentStreamingMessage,
          timestamp: new Date().toISOString()
        }]);
        setCurrentStreamingMessage('');
      }
      setSources(data.sources || []);
      setIsStreaming(false);
      setIsLoading(false);
    });

    socketRef.current.on('chat:error', (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${data.error}`,
        timestamp: new Date().toISOString(),
        isError: true
      }]);
      setIsStreaming(false);
      setIsLoading(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId, apiBaseUrl]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const data = await fetchHistory(sessionId, apiBaseUrl);
      if (data.history) {
        setMessages(data.history);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSendMessage = async (query, useStreaming = true) => {
    if (!query.trim() || isLoading || isStreaming) return;

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setSources([]);
    setCurrentStreamingMessage('');

    try {
      const isSocketConnected = socketRef.current && socketRef.current.connected;
      
      if (useStreaming && isSocketConnected) {
        setIsStreaming(true);
        socketRef.current.emit('chat:message', {
          query,
          sessionId
        });
      } else {
        const response = await sendMessage(query, sessionId, apiBaseUrl);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString()
        }]);
        setSources(response.sources || []);
        setIsLoading(false);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      }]);
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleResetSession = async () => {
    try {
      await clearSession(sessionId, apiBaseUrl);
      setMessages([]);
      setSources([]);
      onNewSession();
    } catch (error) {
      console.error('Error resetting session:', error);
    }
  };

  const displayMessages = [...messages];
  if (isStreaming && currentStreamingMessage) {
    displayMessages.push({
      role: 'assistant',
      content: currentStreamingMessage,
      timestamp: new Date().toISOString(),
      isStreaming: true
    });
  }

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <button 
          className="reset-button" 
          onClick={handleResetSession}
          disabled={isLoading || isStreaming}
        >
          Reset Session
        </button>
        <div className="session-info">
          Session: {sessionId?.substring(0, 8)}...
        </div>
      </div>
      
      <MessageList 
        messages={displayMessages} 
        sources={sources}
        isLoading={isLoading && !isStreaming}
      />
      
      <InputBox 
        onSend={handleSendMessage}
        disabled={isLoading || isStreaming}
      />
      
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatScreen;


