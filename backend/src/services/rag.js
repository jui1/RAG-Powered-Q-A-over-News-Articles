import { getCollection } from '../config/vectorStore.js';
import { getEmbedding } from './embeddings.js';
import { generateResponse, generateStreamingResponse } from './gemini.js';

export async function retrieveRelevantArticles(query, topK = 5) {
  try {
    const queryEmbedding = await getEmbedding(query);
    const collection = await getCollection();
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      include: ['documents', 'metadatas', 'distances']
    });
    
    if (!results.documents || results.documents[0].length === 0) {
      return [];
    }
    
    return results.documents[0].map((doc, idx) => ({
      content: doc,
      metadata: results.metadatas[0][idx] || {},
      distance: results.distances[0][idx]
    }));
  } catch (error) {
    console.error('Error retrieving articles:', error);
    return [];
  }
}

export async function getRAGResponse(query, sessionId, chatHistory = []) {
  const relevantArticles = await retrieveRelevantArticles(query, 5);
  
  if (relevantArticles.length === 0) {
    return {
      response: "I couldn't find relevant information in the news articles to answer your question. Please try rephrasing or asking about a different topic.",
      sources: []
    };
  }
  
  const response = await generateResponse(query, relevantArticles, chatHistory);
  
  return {
    response,
    sources: relevantArticles.map(article => ({
      title: article.metadata.title || 'Untitled',
      url: article.metadata.url || '',
      snippet: article.content.substring(0, 200) + '...'
    }))
  };
}

export async function getRAGStreamingResponse(query, sessionId, chatHistory = [], onChunk) {
  const relevantArticles = await retrieveRelevantArticles(query, 5);
  
  if (relevantArticles.length === 0) {
    const message = "I couldn't find relevant information in the news articles to answer your question. Please try rephrasing or asking about a different topic.";
    if (onChunk) {
      onChunk(message);
    }
    return {
      response: message,
      sources: []
    };
  }
  
  const response = await generateStreamingResponse(query, relevantArticles, chatHistory, onChunk);
  
  return {
    response,
    sources: relevantArticles.map(article => ({
      title: article.metadata.title || 'Untitled',
      url: article.metadata.url || '',
      snippet: article.content.substring(0, 200) + '...'
    }))
  };
}


