import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateResponse(query, context, chatHistory = []) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const systemPrompt = `You are a helpful assistant that answers questions based on the provided news articles context. 
Use only the information from the context to answer. If the context doesn't contain relevant information, 
say so politely. Be concise and accurate.`;

    const contextText = context.map((item, idx) => 
      `[Article ${idx + 1}]\n${item.content}\n`
    ).join('\n---\n\n');

    const historyText = chatHistory.length > 0 
      ? '\n\nPrevious conversation:\n' + chatHistory.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')
      : '';

    const prompt = `${systemPrompt}\n\nContext from news articles:\n${contextText}\n\n${historyText}\n\nUser question: ${query}\n\nAssistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response from Gemini API');
  }
}

export async function generateStreamingResponse(query, context, chatHistory = [], onChunk) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const systemPrompt = `You are a helpful assistant that answers questions based on the provided news articles context. 
Use only the information from the context to answer. If the context doesn't contain relevant information, 
say so politely. Be concise and accurate.`;

    const contextText = context.map((item, idx) => 
      `[Article ${idx + 1}]\n${item.content}\n`
    ).join('\n---\n\n');

    const historyText = chatHistory.length > 0 
      ? '\n\nPrevious conversation:\n' + chatHistory.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')
      : '';

    const prompt = `${systemPrompt}\n\nContext from news articles:\n${contextText}\n\n${historyText}\n\nUser question: ${query}\n\nAssistant:`;

    const result = await model.generateContentStream(prompt);
    
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      if (onChunk) {
        onChunk(chunkText);
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error('Error generating streaming response:', error);
    throw new Error('Failed to generate streaming response from Gemini API');
  }
}


