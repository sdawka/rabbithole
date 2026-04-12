import { getSetting, getDefaultPreset, getPreset } from '../db/config.js';
import type { Preset } from '../types/index.js';

export async function callLLM(
  userPrompt: string,
  systemPrompt: string,
  presetId?: string | null
): Promise<string> {
  const apiKey = await getSetting('openrouter_api_key');
  if (!apiKey) throw new Error('OpenRouter API key not configured');

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
