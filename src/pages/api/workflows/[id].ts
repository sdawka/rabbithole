import type { APIRoute } from 'astro';
import { getWorkflow, updateWorkflow, deleteWorkflow } from '../../../db/workflows.js';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.DB;
  const workflow = await getWorkflow(db, params.id!);
  if (!workflow) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(workflow), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const db = locals.runtime.env.DB;
  const data = await request.json();
  const workflow = await updateWorkflow(db, params.id!, data);
  if (!workflow) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(workflow), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.DB;
  const deleted = await deleteWorkflow(db, params.id!);
  return new Response(JSON.stringify({ deleted }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
