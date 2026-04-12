import type { D1Database } from '@cloudflare/workers-types';
import { getSetting } from '../db/config.js';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

async function getApiKey(db: D1Database): Promise<string> {
  const apiKey = await getSetting(db, 'tavily_api_key');
  if (!apiKey) throw new Error('Tavily API key not configured');
  return apiKey;
}

export async function tavilySearch(db: D1Database, query: string, maxResults = 5): Promise<TavilySearchResult[]> {
  const apiKey = await getApiKey(db);

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Tavily search error (${response.status}): ${err}`);
  }

  const data = await response.json() as { results: TavilySearchResult[] };
  return data.results ?? [];
}

export async function tavilyExtract(db: D1Database, urls: string[]): Promise<Array<{ url: string; raw_content: string }>> {
  const apiKey = await getApiKey(db);

  const response = await fetch('https://api.tavily.com/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      urls,
      format: 'markdown',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Tavily extract error (${response.status}): ${err}`);
  }

  const data = await response.json() as { results: Array<{ url: string; raw_content: string }> };
  return data.results ?? [];
}
