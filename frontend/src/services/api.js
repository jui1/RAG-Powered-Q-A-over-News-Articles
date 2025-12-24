import axios from 'axios';

export async function sendMessage(query, sessionId, apiBaseUrl) {
  const response = await axios.post(`${apiBaseUrl}/api/chat/message`, {
    query,
    sessionId
  });
  return response.data;
}

export async function sendStreamingMessage(query, sessionId, apiBaseUrl, onChunk) {
  const response = await fetch(`${apiBaseUrl}/api/chat/message/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, sessionId })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'chunk' && onChunk) {
          onChunk(data.chunk);
        } else if (data.type === 'done') {
          return data;
        }
      }
    }
  }
}

export async function fetchHistory(sessionId, apiBaseUrl) {
  const response = await axios.get(`${apiBaseUrl}/api/chat/history/${sessionId}`);
  return response.data;
}

export async function clearSession(sessionId, apiBaseUrl) {
  const response = await axios.delete(`${apiBaseUrl}/api/chat/session/${sessionId}`);
  return response.data;
}


