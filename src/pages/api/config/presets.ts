import type { APIRoute } from 'astro';
import { listPresets, createPreset, updatePreset, deletePreset } from '../../../db/config.js';

export const GET: APIRoute = async () => {
  const presets = await listPresets();
  return new Response(JSON.stringify(presets), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const preset = await createPreset(data);
  return new Response(JSON.stringify(preset), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const data = await request.json();
  const { id, ...rest } = data;
  const preset = await updatePreset(id, rest);
  if (!preset) {
    return new Response(JSON.stringify({ error: 'Preset not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(preset), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json();
  const deleted = await deletePreset(id);
  return new Response(JSON.stringify({ deleted }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
