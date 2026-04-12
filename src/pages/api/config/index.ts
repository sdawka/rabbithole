import type { APIRoute } from 'astro';
import { getAllSettings, setSetting } from '../../../db/config.js';

export const GET: APIRoute = async () => {
  const settings = await getAllSettings();
  return new Response(JSON.stringify(settings), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const data = await request.json();
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      await setSetting(key, value);
    }
  }
  const settings = await getAllSettings();
  return new Response(JSON.stringify(settings), {
    headers: { 'Content-Type': 'application/json' },
  });
};
