import type { searchResult } from '../providers/types.js';

// Python retrieval service (rag/server.py)
const RAG_URL = process.env.RAG_URL ?? 'http://127.0.0.1:8001';

interface WikiHit {
  page: string;
  section: string;
  url: string;
  text: string;
  score: number;
}

// Returns the k wiki chunks closest to the query, in the same shape as web results so the
// rest of the pipeline (context numbering, SSE event, Sources UI) treats them identically.
export async function searchWiki(query: string, k = 4): Promise<searchResult[]> {
  const response = await fetch(`${RAG_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, k }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`RAG service error: ${response.status}`);
  }
  const data = (await response.json()) as { results: WikiHit[] };
  return data.results.map(hit => ({
    title: `${hit.page} › ${hit.section}`,
    snippet: hit.text,
    url: hit.url,
    source: 'wiki',
  }));
}
