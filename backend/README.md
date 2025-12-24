# RAG-Powered News Chatbot - Backend

A Node.js/Express backend for a RAG-powered chatbot that answers questions over a news corpus using Retrieval-Augmented Generation.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Vector Database**: ChromaDB
- **Embeddings**: Jina Embeddings v2 (with fallback)
- **LLM**: Google Gemini Pro
- **Cache/Sessions**: Redis
- **Real-time**: Socket.io
- **News Ingestion**: RSS Parser + Cheerio

## Prerequisites

- Node.js 18+ 
- Redis server running locally or accessible via URL
- ChromaDB server running (or use cloud instance)
- Google Gemini API key
- Jina API key (optional, has fallback)

## Setup

1. **Install dependencies:**
```bash
npm install --legacy-peer-deps
```

**Note:** The `--legacy-peer-deps` flag is required due to a peer dependency conflict between ChromaDB and the Google Generative AI SDK. This is safe to use as the dependency is optional.

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3001
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key_here
JINA_API_KEY=your_jina_api_key_here (optional)
CHROMA_HOST=localhost
CHROMA_PORT=8000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

3. **Start ChromaDB:**
```bash
# Using Docker
docker run -p 8000:8000 chromadb/chroma

# Or install and run locally
# See: https://docs.trychroma.com/getting-started
```

4. **Start Redis:**
```bash
# Using Docker
docker run -p 6379:6379 redis:alpine

# Or install locally
# macOS: brew install redis && redis-server
# Linux: sudo apt-get install redis-server && redis-server
```

5. **Ingest news articles:**
```bash
npm run ingest
```

This will:
- Fetch ~50 articles from Reuters, CNN, and BBC RSS feeds
- Scrape article content
- Generate embeddings
- Store in ChromaDB vector store

6. **Start the server:**
```bash
npm start
# or for development with auto-reload
npm run dev
```

## API Endpoints

### POST `/api/chat/message`
Send a chat message and get response.

**Request:**
```json
{
  "query": "What are the latest news about technology?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "sessionId": "uuid-session-id",
  "response": "Based on the news articles...",
  "sources": [
    {
      "title": "Article Title",
      "url": "https://...",
      "snippet": "Article snippet..."
    }
  ]
}
```

### POST `/api/chat/message/stream`
Get streaming response (Server-Sent Events).

**Request:** Same as above

**Response:** SSE stream with chunks:
```
data: {"chunk": "Based on", "type": "chunk"}
data: {"chunk": " the news", "type": "chunk"}
...
data: {"type": "done", "sources": [...]}
```

### GET `/api/chat/history/:sessionId`
Get chat history for a session.

**Response:**
```json
{
  "sessionId": "uuid",
  "history": [
    {
      "role": "user",
      "content": "What is AI?",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "AI is...",
      "timestamp": "2024-01-01T00:00:01.000Z"
    }
  ]
}
```

### DELETE `/api/chat/session/:sessionId`
Clear a session's chat history.

**Response:**
```json
{
  "success": true,
  "message": "Session cleared"
}
```

### POST `/api/chat/session`
Create a new session.

**Response:**
```json
{
  "sessionId": "new-uuid"
}
```

## WebSocket Events

### Client → Server

**`chat:message`**
```json
{
  "query": "Your question",
  "sessionId": "optional-session-id"
}
```

### Server → Client

**`chat:sessionId`** - Session ID assigned
```json
{
  "sessionId": "uuid"
}
```

**`chat:chunk`** - Streaming response chunk
```json
{
  "chunk": "text chunk"
}
```

**`chat:done`** - Response complete
```json
{
  "sources": [...]
}
```

**`chat:error`** - Error occurred
```json
{
  "error": "Error message"
}
```

## Caching & Performance

### Redis Session Management

- **TTL**: 24 hours (86400 seconds)
- **Key Pattern**: `chat:session:{sessionId}`
- **Storage**: JSON array of messages

### Cache Warming Strategy

To warm the cache on startup, you could:

1. **Pre-load common queries:**
```javascript
const commonQueries = [
  "What are the latest news?",
  "Tell me about technology",
  "What happened today?"
];

for (const query of commonQueries) {
  await getRAGResponse(query, 'warmup-session');
}
```

2. **Keep-alive sessions:**
```javascript
// Extend TTL on each interaction
await extendSessionTTL(sessionId);
```

3. **Background refresh:**
```javascript
// Periodically refresh embeddings for popular articles
setInterval(async () => {
  await refreshPopularArticles();
}, 3600000); // Every hour
```

### TTL Configuration

Modify `SESSION_TTL` in `src/services/session.js`:

```javascript
const SESSION_TTL = 86400; // 24 hours in seconds
```

For production, consider:
- **Active sessions**: 24-48 hours
- **Inactive sessions**: 1-7 days
- **Archived sessions**: Move to SQL DB after TTL expires

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ├── REST API (Express)
       └── WebSocket (Socket.io)
              │
       ┌──────┴──────┐
       │             │
┌──────▼──────┐ ┌───▼──────┐
│    Redis    │ │  RAG     │
│  (Sessions) │ │ Service  │
└─────────────┘ └────┬─────┘
                     │
            ┌────────┴────────┐
            │                 │
      ┌─────▼─────┐    ┌──────▼──────┐
      │  ChromaDB │    │   Gemini    │
      │  (Vector) │    │     API     │
      └───────────┘    └─────────────┘
```

## Development

```bash
# Run with auto-reload
npm run dev

# Ingest news (run after first setup)
npm run ingest
```

## Deployment

### Environment Variables for Production

- Set `NODE_ENV=production`
- Use Redis cloud service (Redis Cloud, AWS ElastiCache, etc.)
- Use ChromaDB cloud or self-hosted instance
- Configure CORS with production frontend URL

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

1. **ChromaDB connection error**: Ensure ChromaDB is running on specified host/port
2. **Redis connection error**: Check Redis URL and ensure server is accessible
3. **Gemini API errors**: Verify API key and quota limits
4. **Embedding errors**: Jina API key optional, fallback embedding will be used

## License

MIT


