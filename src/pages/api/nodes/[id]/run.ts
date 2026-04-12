import type { APIRoute } from 'astro';
import { runNode } from '../../../../engine/runner.js';
import { extractKeys } from '../../../../engine/openrouter.js';

export const POST: APIRoute = async ({ params, request }) => {
  const keys = extractKeys(request);
  try {
    const node = await runNode(keys, params.id!);
    return new Response(JSON.stringify(node), {
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
