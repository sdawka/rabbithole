import type { APIRoute } from 'astro';
import { getWorkflow, updateWorkflow, deleteWorkflow } from '../../../db/workflows.js';

export const GET: APIRoute = async ({ params }) => {
  const workflow = await getWorkflow(params.id!);
  if (!workflow) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(workflow), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const data = await request.json();
  const workflow = await updateWorkflow(params.id!, data);
  if (!workflow) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(workflow), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const deleted = await deleteWorkflow(params.id!);
  return new Response(JSON.stringify({ deleted }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
