import type { APIRoute } from 'astro';
import { createEdge, deleteEdge } from '../../../db/edges.js';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const edge = await createEdge(data);
  return new Response(JSON.stringify(edge), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json();
  const deleted = await deleteEdge(id);
  return new Response(JSON.stringify({ deleted }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
