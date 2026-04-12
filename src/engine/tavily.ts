import type { ApiKeys } from './openrouter.js';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function tavilySearch(keys: ApiKeys, query: string, maxResults = 5): Promise<TavilySearchResult[]> {
  const apiKey = keys.tavily_api_key;
  if (!apiKey) throw new Error('Tavily API key not configured — add it in the settings on the home page');

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

export async function tavilyExtract(keys: ApiKeys, urls: string[]): Promise<Array<{ url: string; raw_content: string }>> {
  const apiKey = keys.tavily_api_key;
  if (!apiKey) throw new Error('Tavily API key not configured — add it in the settings on the home page');

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
