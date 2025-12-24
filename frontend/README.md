# RAG-Powered News Chatbot - Frontend

A React frontend for a RAG-powered chatbot that answers questions over a news corpus.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: SCSS
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **State Management**: React Hooks

## Prerequisites

- Node.js 18+
- Backend server running (see backend README)

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables (optional):**
```bash
cp .env.example .env
```

Edit `.env` if your backend is not running on `http://localhost:3001`:
```env
VITE_API_URL=http://localhost:3001
```

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Features

- **Chat Interface**: Clean, modern chat UI with message history
- **Streaming Responses**: Real-time streaming of bot responses via WebSocket
- **Session Management**: Automatic session creation and persistence
- **Source Citations**: Display of source articles used for answers
- **Reset Session**: Clear chat history and start new session
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

```
┌─────────────┐
│   React     │
│   App       │
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
┌──▼──┐ ┌──▼──────┐
│ REST│ │ WebSocket│
│ API │ │ (Socket.io)│
└─────┘ └──────────┘
       │
┌──────▼──────┐
│   Backend   │
│   Server    │
└─────────────┘
```

## Components

- **App**: Main application component, manages session
- **ChatScreen**: Main chat interface container
- **MessageList**: Displays chat messages
- **Message**: Individual message component
- **InputBox**: Text input with send button
- **SourcesList**: Displays source articles

## API Integration

The frontend communicates with the backend via:

1. **REST API**: For non-streaming messages and session management
2. **WebSocket (Socket.io)**: For real-time streaming responses

### REST Endpoints Used

- `POST /api/chat/message` - Send message (non-streaming)
- `GET /api/chat/history/:sessionId` - Get chat history
- `DELETE /api/chat/session/:sessionId` - Clear session

### WebSocket Events

- **Emit**: `chat:message` - Send query
- **Listen**: 
  - `chat:sessionId` - Receive session ID
  - `chat:chunk` - Receive streaming chunks
  - `chat:done` - Response complete
  - `chat:error` - Error occurred

## Styling

The app uses SCSS for styling with:
- Modern gradient background
- Smooth animations
- Responsive design
- Custom scrollbars
- Typing indicators

## Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL` (your backend URL)

### Netlify

1. Connect your repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variable: `VITE_API_URL`

### Other Platforms

Any static hosting service that supports Vite builds will work. Ensure you set the `VITE_API_URL` environment variable to point to your backend.

## License

MIT


