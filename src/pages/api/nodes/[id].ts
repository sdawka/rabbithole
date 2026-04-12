import type { APIRoute } from 'astro';
import { getNode, updateNode, deleteNode, createNode } from '../../../db/nodes.js';

export const GET: APIRoute = async ({ params }) => {
  const node = await getNode(params.id!);
  if (!node) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(node), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ params, request }) => {
  // params.id here is actually workflow_id (used for creating nodes in a workflow)
  const data = await request.json();
  const node = await createNode({ ...data, workflow_id: params.id! });
  return new Response(JSON.stringify(node), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const data = await request.json();
  const node = await updateNode(params.id!, data);
  if (!node) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(node), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const deleted = await deleteNode(params.id!);
  return new Response(JSON.stringify({ deleted }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
