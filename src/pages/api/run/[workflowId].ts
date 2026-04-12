import type { APIRoute } from 'astro';
import { getWorkflow } from '../../../db/workflows.js';
import { topologicalSort } from '../../../engine/dag.js';
import { runNode } from '../../../engine/runner.js';

export const POST: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.DB;
  const workflow = await getWorkflow(db, params.workflowId!);
  if (!workflow) {
    return new Response(JSON.stringify({ error: 'Workflow not found' }), { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const layers = topologicalSort(workflow.nodes, workflow.edges);

        for (const layer of layers) {
          const results = await Promise.allSettled(
            layer.map(async (nodeId) => {
              send({ type: 'node_start', nodeId });
              const result = await runNode(db, nodeId);
              send({
                type: 'node_complete',
                nodeId,
                status: result.status,
                outputPreview: result.output_data?.slice(0, 200) ?? '',
                error: result.error_message || undefined,
              });
              return result;
            })
          );

          const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'error'));
          if (failed.length > 0) {
            // Continue execution — other branches may still be valid
          }
        }

        send({ type: 'workflow_complete' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        send({ type: 'workflow_error', error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
};
