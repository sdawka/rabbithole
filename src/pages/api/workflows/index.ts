import type { APIRoute } from 'astro';
import { listWorkflows, createWorkflow } from '../../../db/workflows.js';
import { createNode } from '../../../db/nodes.js';
import { createEdge } from '../../../db/edges.js';
import { getDefaultTemplate, nodeTypes } from '../../../nodes/registry.js';

export const GET: APIRoute = async () => {
  const workflows = await listWorkflows();
  return new Response(JSON.stringify(workflows), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const workflow = await createWorkflow({ name: data.name });

  if (data.fromTemplate) {
    const template = getDefaultTemplate();
    const nodeIdMap = new Map<string, string>();

    for (const n of template.nodes) {
      const typeDef = nodeTypes[n.type];
      const created = await createNode({
        workflow_id: workflow.id,
        node_type: n.type,
        title: n.title,
        position_x: n.x,
        position_y: n.y,
        system_prompt: typeDef?.defaultPrompt ?? '',
      });
      nodeIdMap.set(n.type, created.id);
    }

    for (const e of template.edges) {
      const sourceId = nodeIdMap.get(e.source);
      const targetId = nodeIdMap.get(e.target);
      if (sourceId && targetId) {
        await createEdge({
          workflow_id: workflow.id,
          source_node: sourceId,
          target_node: targetId,
          source_handle: e.sourceHandle,
          target_handle: e.targetHandle,
        });
      }
    }
  }

  return new Response(JSON.stringify(workflow), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
