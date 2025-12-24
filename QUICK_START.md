# Quick Start Guide

## Issue: WebSocket Connection Failed

If you're seeing WebSocket connection errors, follow these steps:

## Step 1: Start Redis (Required for Session Persistence)

### Option A: Using Docker (Recommended)
```bash
# Start Docker Desktop first, then:
cd /Users/juimandal/Assignment-
docker-compose up -d redis
```

### Option B: Install Redis Locally
```bash
# macOS
brew install redis
brew services start redis

# Or run manually
redis-server
```

### Option C: Use In-Memory Storage (No Redis)
The server will work without Redis, but sessions won't persist across server restarts.

## Step 2: Start ChromaDB (Required for Vector Search)

### Option A: Using Docker
```bash
docker-compose up -d chromadb
```

### Option B: Install Locally
```bash
# See ChromaDB docs for installation
# Or use Docker:
docker run -p 8000:8000 chromadb/chroma
```

## Step 3: Verify Services

```bash
# Check Redis
redis-cli ping
# Should return: PONG

# Check ChromaDB
curl http://localhost:8000/api/v1/heartbeat
# Should return: {"nanosecond heartbeat":...}
```

## Step 4: Restart Backend Server

```bash
cd backend
npm start
```

You should see:
```
Redis Client Connected (if Redis is running)
Server running on port 3001
```

## Step 5: Test WebSocket Connection

Open browser console and check for:
- ✅ "WebSocket connected" message
- ❌ No connection errors

## Troubleshooting

### WebSocket still failing?

1. **Check backend is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check backend logs** for errors

3. **Verify CORS settings** in backend `.env`:
   ```
   FRONTEND_URL=http://localhost:3000
   ```

4. **Try REST API fallback** - The frontend will automatically use REST if WebSocket fails

### Redis Connection Issues?

The server now works without Redis using in-memory storage. You'll see:
```
Failed to connect to Redis: ...
Server will continue without Redis. Session history will not persist.
```

This is fine for testing, but Redis is recommended for production.

