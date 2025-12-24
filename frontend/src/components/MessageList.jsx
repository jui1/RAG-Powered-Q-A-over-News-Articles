import Message from './Message';
import SourcesList from './SourcesList';

function MessageList({ messages, sources, isLoading }) {
  return (
    <div className="message-list">
      {messages.length === 0 && !isLoading && (
        <div className="empty-state">
          <p>Ask me anything about the news articles!</p>
          <p className="hint">Try: "What are the latest technology news?"</p>
        </div>
      )}
      
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
      
      {isLoading && messages.length > 0 && (
        <div className="loading-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      
      {sources.length > 0 && (
        <SourcesList sources={sources} />
      )}
    </div>
  );
}

export default MessageList;


