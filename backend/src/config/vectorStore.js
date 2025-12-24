import { ChromaClient } from 'chromadb';

const chromaClient = new ChromaClient({
  path: `http://${process.env.CHROMA_HOST || 'localhost'}:${process.env.CHROMA_PORT || 8000}`
});

const COLLECTION_NAME = 'news_articles';

let collection = null;
let connectionChecked = false;

export async function getCollection() {
  if (!connectionChecked) {
    connectionChecked = true;
    try {
      await chromaClient.heartbeat();
      console.log('✓ ChromaDB connected');
    } catch (error) {
      console.error('✗ ChromaDB connection failed:', error.message);
      console.error('\n⚠ ChromaDB is required for the RAG pipeline.');
      console.error('   Please start ChromaDB:');
      console.error('   - Docker: docker run -p 8000:8000 chromadb/chroma');
      console.error('   - Or: docker-compose up -d chromadb\n');
      throw new Error('ChromaDB is not available. Please start ChromaDB server.');
    }
  }
  
  if (!collection) {
    try {
      collection = await chromaClient.getOrCreateCollection({
        name: COLLECTION_NAME,
        metadata: { description: 'News articles for RAG chatbot' }
      });
    } catch (error) {
      console.error('Error getting collection:', error.message);
      throw error;
    }
  }
  return collection;
}

export { chromaClient };


