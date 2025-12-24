import axios from 'axios';

const JINA_API_URL = 'https://api.jina.ai/v1/embeddings';

export async function getEmbedding(text) {
  try {
    if (!process.env.JINA_API_KEY) {
      return getFallbackEmbedding(text);
    }
    
    const response = await axios.post(
      JINA_API_URL,
      {
        input: [text],
        model: 'jina-embeddings-v2-base-en'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data[0].embedding;
  } catch (error) {
    if (error.response?.status === 401) {
      console.warn('⚠ Invalid JINA_API_KEY. Using fallback embedding.');
      return getFallbackEmbedding(text);
    }
    
    if (!process.env.JINA_API_KEY || error.response?.status === 403) {
      console.warn('⚠ JINA_API_KEY not set or invalid. Using fallback embedding.');
      return getFallbackEmbedding(text);
    }
    
    console.error('Error getting embedding:', error.response?.data?.detail || error.message);
    return getFallbackEmbedding(text);
  }
}

function getFallbackEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(768).fill(0);
  
  words.forEach((word, idx) => {
    const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    embedding[hash % 768] += 1 / (idx + 1);
  });
  
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : val);
}

export async function getEmbeddings(texts) {
  try {
    if (!process.env.JINA_API_KEY) {
      return texts.map(text => getFallbackEmbedding(text));
    }
    
    const response = await axios.post(
      JINA_API_URL,
      {
        input: texts,
        model: 'jina-embeddings-v2-base-en'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data.map(item => item.embedding);
  } catch (error) {
    if (!process.env.JINA_API_KEY || error.response?.status === 401 || error.response?.status === 403) {
      console.warn('⚠ JINA_API_KEY not set or invalid. Using fallback embeddings.');
      return texts.map(text => getFallbackEmbedding(text));
    }
    
    console.error('Error getting embeddings:', error.response?.data?.detail || error.message);
    return texts.map(text => getFallbackEmbedding(text));
  }
}


