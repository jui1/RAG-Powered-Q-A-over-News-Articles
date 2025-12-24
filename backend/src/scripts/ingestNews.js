import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { getCollection } from '../config/vectorStore.js';
import { getEmbeddings } from '../services/embeddings.js';
import dotenv from 'dotenv';

dotenv.config();

const parser = new Parser();

async function fetchRSSFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, 50);
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
}

async function scrapeArticleContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    $('script, style, nav, header, footer, aside, .advertisement, .ad').remove();
    
    const title = $('h1').first().text().trim() || $('title').text().trim();
    const content = $('article p, .article-content p, .post-content p, main p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 50)
      .join('\n\n')
      .substring(0, 3000);
    
    return { title, content: content || $('body').text().trim().substring(0, 3000) };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return { title: 'Untitled', content: '' };
  }
}

async function ingestNews() {
  console.log('Starting news ingestion...');
  
  const rssFeeds = [
    'https://feeds.reuters.com/reuters/topNews',
    'https://rss.cnn.com/rss/edition.rss',
    'https://feeds.bbci.co.uk/news/rss.xml'
  ];
  
  const allArticles = [];
  
  for (const feedUrl of rssFeeds) {
    console.log(`Fetching from ${feedUrl}...`);
    const items = await fetchRSSFeed(feedUrl);
    
    for (const item of items) {
      if (allArticles.length >= 50) break;
      
      console.log(`Scraping: ${item.title}`);
      const { title, content } = await scrapeArticleContent(item.link);
      
      if (content && content.length > 100) {
        allArticles.push({
          title: title || item.title,
          content: `${title}\n\n${content}`,
          url: item.link,
          pubDate: item.pubDate || new Date().toISOString()
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (allArticles.length >= 50) break;
  }
  
  console.log(`\nIngested ${allArticles.length} articles. Generating embeddings...`);
  
  const texts = allArticles.map(article => article.content);
  const embeddings = await getEmbeddings(texts);
  
  console.log('Storing in vector database...');
  
  const collection = await getCollection();
  
  const ids = allArticles.map((_, idx) => `article_${Date.now()}_${idx}`);
  const metadatas = allArticles.map(article => ({
    title: article.title,
    url: article.url,
    pubDate: article.pubDate
  }));
  
  await collection.add({
    ids,
    embeddings,
    documents: texts,
    metadatas
  });
  
  console.log(`\nSuccessfully ingested ${allArticles.length} articles into vector store!`);
  process.exit(0);
}

ingestNews().catch(error => {
  console.error('Ingestion failed:', error);
  process.exit(1);
});


