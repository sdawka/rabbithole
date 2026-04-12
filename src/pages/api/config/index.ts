import type { APIRoute } from 'astro';
import { getAllSettings, setSetting } from '../../../db/config.js';

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime.env.DB;
  const settings = await getAllSettings(db);
  return new Response(JSON.stringify(settings), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  const data = await request.json();
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      await setSetting(db, key, value);
    }
  }
  const settings = await getAllSettings(db);
  return new Response(JSON.stringify(settings), {
    headers: { 'Content-Type': 'application/json' },
  });
};
