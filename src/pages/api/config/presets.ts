import type { APIRoute } from 'astro';
import { listPresets, createPreset, updatePreset, deletePreset } from '../../../db/config.js';

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime.env.DB;
  const presets = await listPresets(db);
  return new Response(JSON.stringify(presets), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  const data = await request.json();
  const preset = await createPreset(db, data);
  return new Response(JSON.stringify(preset), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  const data = await request.json();
  const { id, ...rest } = data;
  const preset = await updatePreset(db, id, rest);
  if (!preset) {
    return new Response(JSON.stringify({ error: 'Preset not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(preset), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  const { id } = await request.json();
  const deleted = await deletePreset(db, id);
  return new Response(JSON.stringify({ deleted }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
