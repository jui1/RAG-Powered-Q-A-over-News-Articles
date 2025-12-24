function Message({ message }) {
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isStreaming = message.isStreaming;

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'} ${isError ? 'message-error' : ''}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        <div className="message-text">
          {message.content}
          {isStreaming && <span className="streaming-cursor">|</span>}
        </div>
        {message.timestamp && (
          <div className="message-timestamp">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;


