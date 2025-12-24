import { useState, useEffect } from 'react';
import ChatScreen from './components/ChatScreen';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatbot_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = generateUUID();
      setSessionId(newSessionId);
      localStorage.setItem('chatbot_session_id', newSessionId);
    }
  }, []);

  const handleNewSession = () => {
    const newSessionId = generateUUID();
    setSessionId(newSessionId);
    localStorage.setItem('chatbot_session_id', newSessionId);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>News Chatbot</h1>
        <p className="subtitle">RAG-Powered Q&A over News Articles</p>
      </header>
      <ChatScreen 
        sessionId={sessionId} 
        onNewSession={handleNewSession}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
}

export default App;

