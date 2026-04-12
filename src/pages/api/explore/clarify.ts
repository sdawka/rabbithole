import type { APIRoute } from 'astro';
import { callLLM } from '../../../engine/openrouter.js';

export const POST: APIRoute = async ({ request }) => {
  const { topic, context } = await request.json();

  const prompt = `A user wants to explore a "rabbit hole" topic. Help them focus their exploration.

Topic: "${topic}"
${context ? `What they already know / their angle: "${context}"` : 'No additional context provided.'}

Suggest 4-5 specific angles or directions they could explore. Each should be distinct and interesting.

Return ONLY valid JSON, no markdown fences:
{
  "summary": "One sentence restating what they want to explore and why it's interesting",
  "angles": [
    {"id": "angle_1", "label": "Short label (3-5 words)", "description": "One sentence describing this angle"}
  ]
}`;

  try {
    const response = await callLLM(prompt, 'Return only valid JSON. No explanation outside the JSON.', null);
    const cleaned = response.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    const data = JSON.parse(cleaned);
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
