import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getProvider } from './src/providers/index.js';

const app = express();
app.use(cors());
app.use(express.json());

const SERPAPI_KEY = process.env.SERPAPI_KEY;
if (!SERPAPI_KEY) throw new Error('SERPAPI_KEY not set in .env');

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function searchSerpAPI(query: string) {
  const url = `https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&engine=google`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.status}`);
  }
  const data = await response.json();
  return data.organic_results || [];
}

const llm = getProvider();
console.log(`🤖 Using LLM Provider: ${llm.name}`);

app.get('/api/search', async (req, res) => {
  const query = req.query.prompt as string;
  let content = '';
  let allResults: any[] = [];

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    content = await llm.chat(
      [
        {
          role: 'system',
          content: 'You are a search query specialist. Given the user request, generate 2-3 precise search queries for Google that will help find relevant information. Output ONLY a JSON array of strings like ["query1","query2","query3"]'
        },
        { role: 'user', content: query }
      ],
      { temperature: 0.3 }
    );
  } catch (error) {
    console.error('Error generating search queries:', error);
    return res.status(500).json({ error: 'Failed to generate search queries' });
  }

  let queriesArray: string[];
  try {
    queriesArray = JSON.parse(content);
  } catch (e) {
    console.error('Invalid JSON from model:', content);
    return res.status(500).json({ error: 'Model returned invalid JSON' });
  }

  try {
    for (const q of queriesArray) {
      console.log(`Searching: ${q}`);
      const results = await searchSerpAPI(q);
      const formatted = results.slice(0, 5).map((r: any) => ({
        title: r.title,
        snippet: r.snippet,
        url: r.link
      }));
      allResults = allResults.concat(formatted);
      await sleep(1000);
    }
  } catch (error) {
    console.error('Search failed:', error);
    return res.status(500).json({ error: 'Web search failed' });
  }

  res.json({ queries: queriesArray, results: allResults });
});


app.get('/api/stream-agents', async (req, res) => {
  const prompt = req.query.prompt as string;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // ------------------------------------------------------------------
    // TODO(you): Challenge A - Add Search Agent before Researcher
    // 1. Call llm.chat() to generate search queries (stream with agent3-token)
    // 2. Parse JSON, call SerpAPI for each query
    // 3. Send 'search-results' event with { queries, results }
    // 4. Pass search results to Researcher as context
    // ------------------------------------------------------------------
    let queryContent = '';
    for await (const token of llm.chatStream(
      [
        {
          role: 'system',
          content: 'You are a search query specialist. Given the user request, generate 2-3 precise search queries for Google that will help find relevant information. Output ONLY a JSON array of strings like ["query1","query2","query3"]'
        },
        { role: 'user', content: prompt }
      ],
      { temperature: 0.3 }
    )) {
      queryContent += token;
      sendEvent('agent3-token', { chunk: token });
    }

    let queriesArray: string[];
    try {
      queriesArray = JSON.parse(queryContent);
    } catch (e) {
      console.error('Invalid JSON from model:', queryContent);
      sendEvent('error', { message: 'Model returned invalid JSON' });
      res.end();
      return;
    }

    const allResults: any[] = [];
    try {
      for (const q of queriesArray) {
        console.log(`Searching: ${q}`);
        const results = await searchSerpAPI(q);
        allResults.push(...results.slice(0, 5).map((r: any) => ({
          title: r.title,
          snippet: r.snippet,
          url: r.link
        })));
        await sleep(1000);
      }
    } catch (error) {
      console.error('Search failed:', error);
      sendEvent('error', { message: 'Web search failed' });
      res.end();
      return;
    }

    const searchContext = allResults.map((r, i) =>
      `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`
    ).join('\n\n');

    sendEvent('search-results', { queries: queriesArray, results: allResults });
    sendEvent('status', { agent: 'search', state: 'completed', message: '✅ Search Agent finished.' });

    sendEvent('status', { agent: 'researcher', state: 'thinking', message: '🔍 Agent 1 (Researcher) is analyzing your request...' });

    let researchNotes = '';
    for await (const token of llm.chatStream(
      [
        {
          role: 'system',
          content: 'You are an Expert Technical Researcher. be extremly concise. Deconstruct the user query and provide concise, high-level technical point notes.'
        },
        { role: 'user', content: `User Request: "${prompt}"\n\nSearch Results:\n${searchContext}` }
      ],
      { temperature: 0.2, maxTokens: 500 }
    )) {
      researchNotes += token;
      sendEvent('agent1-token', { chunk: token });
    }

    sendEvent('status', { agent: 'researcher', state: 'completed', message: '✅ Agent 1 finished notes.' });

    sendEvent('status', { agent: 'writer', state: 'thinking', message: '✍️ Agent 2 (Writer) is generating the final markdown report...' });

    for await (const token of llm.chatStream(
      [
        {
          role: 'system',
          content: 'You are a Senior Technical Writer. Convert research notes into a clean, well-formatted Markdown guide.'
        },
        {
          role: 'user',
          content: `User Request: "${prompt}"\n\nResearcher Notes:\n${researchNotes}`
        }
      ],
      { temperature: 0.7, maxTokens: 600 }
    )) {
      sendEvent('agent2-token', { chunk: token });
    }

    sendEvent('status', { agent: 'writer', state: 'completed', message: '🎉 Pipeline Finished!' });
    res.write('event: done\ndata: {}\n\n');
    res.end();

  } catch (error: any) {
    console.error('Streaming error:', error);
    sendEvent('error', { message: error.message || 'Error communicating with LLM' });
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Multi-Agent SSE Backend running at http://localhost:${PORT}`);
});