import { getDefaultPreset, getPreset } from '../db/config.js';
import type { Preset } from '../types/index.js';

export interface ApiKeys {
  openrouter_api_key: string;
  tavily_api_key: string;
}

export function extractKeys(request: Request): ApiKeys {
  return {
    openrouter_api_key: request.headers.get('X-OpenRouter-Key') ?? '',
    tavily_api_key: request.headers.get('X-Tavily-Key') ?? '',
  };
}

export async function callLLM(
  keys: ApiKeys,
  userPrompt: string,
  systemPrompt: string,
  presetId?: string | null
): Promise<string> {
  const apiKey = keys.openrouter_api_key;
  if (!apiKey) throw new Error('OpenRouter API key not configured — add it in the settings on the home page');

  let preset: Preset | undefined;
  if (presetId) {
    preset = await getPreset(presetId);
  }
  if (!preset) {
    preset = await getDefaultPreset();
  }
  if (!preset) throw new Error('No model preset configured');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://rabbithole-app.dawka.workers.dev',
      'X-Title': 'Rabbithole Explorer',
    },
    body: JSON.stringify({
      model: preset.model_id,
      temperature: preset.temperature,
      max_tokens: preset.max_tokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${err}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}
