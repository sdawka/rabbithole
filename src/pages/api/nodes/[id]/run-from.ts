import type { APIRoute } from 'astro';
import { getNode, updateNode, getWorkflowGraph } from '../../../../db/nodes.js';
import { forkBranch, getOrCreateMainBranch } from '../../../../db/branches.js';
import { runNode } from '../../../../engine/runner.js';
import { extractKeys } from '../../../../engine/openrouter.js';

/**
 * Get all nodes downstream from a starting node (including the start node itself),
 * sorted in topological order so dependencies run first.
 */
function getDownstreamNodesInOrder(
  startId: string,
  nodes: { id: string }[],
  edges: { source_node: string; target_node: string }[]
): string[] {
  const nodeIds = new Set(nodes.map(n => n.id));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const edge of edges) {
    if (!outgoing.has(edge.source_node)) outgoing.set(edge.source_node, []);
    outgoing.get(edge.source_node)!.push(edge.target_node);
    if (!incoming.has(edge.target_node)) incoming.set(edge.target_node, []);
    incoming.get(edge.target_node)!.push(edge.source_node);
  }

  // BFS to find all downstream nodes
  const downstream = new Set<string>();
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (downstream.has(current) || !nodeIds.has(current)) continue;
    downstream.add(current);
    for (const next of outgoing.get(current) ?? []) {
      queue.push(next);
    }
  }

  // Topological sort using Kahn's algorithm (only on downstream subgraph)
  const inDegree = new Map<string, number>();
  for (const id of downstream) {
    inDegree.set(id, 0);
  }
  for (const edge of edges) {
    if (downstream.has(edge.source_node) && downstream.has(edge.target_node)) {
      inDegree.set(edge.target_node, (inDegree.get(edge.target_node) ?? 0) + 1);
    }
  }

  const sorted: string[] = [];
  const ready = [...downstream].filter(id => (inDegree.get(id) ?? 0) === 0);

  while (ready.length > 0) {
    const current = ready.shift()!;
    sorted.push(current);
    for (const next of outgoing.get(current) ?? []) {
      if (!downstream.has(next)) continue;
      const newDegree = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, newDegree);
      if (newDegree === 0) {
        ready.push(next);
      }
    }
  }

  return sorted;
}

export const POST: APIRoute = async ({ params, request }) => {
  const keys = extractKeys(request);
  const startNodeId = params.id!;

  // Parse optional body for branch creation
  let branchName: string | undefined;
  try {
    const body = await request.json();
    branchName = body.branchName;
  } catch {
    // No body or invalid JSON - that's fine, we'll run on current branch
  }

  const startNode = await getNode(startNodeId);
  if (!startNode) {
    return new Response(JSON.stringify({ error: 'Node not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let actualStartNodeId = startNodeId;
  let branchInfo: { id: string; name: string } | null = null;

  // If branchName provided, create a new branch first
  if (branchName) {
    const mainBranch = await getOrCreateMainBranch(startNode.workflow_id);
    const parentBranchId = startNode.branch_id ?? mainBranch.id;

    const { branch, clonedNodes } = await forkBranch({
      workflow_id: startNode.workflow_id,
      fork_node_id: startNodeId,
      branch_name: branchName,
      parent_branch_id: parentBranchId,
    });

    // Find the cloned version of our start node
    const clonedStart = clonedNodes.find(n => n.source_node_id === startNodeId);
    if (clonedStart) {
      actualStartNodeId = clonedStart.id;
    }
    branchInfo = { id: branch.id, name: branch.name };
  }

  const { nodes, edges } = await getWorkflowGraph(startNode.workflow_id);
  const nodeOrder = getDownstreamNodesInOrder(actualStartNodeId, nodes, edges);

  // Reset all downstream nodes to idle before running
  for (const nodeId of nodeOrder) {
    await updateNode(nodeId, { status: 'idle', output_data: '', error_message: '' });
  }

  // SSE stream for progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({
        type: 'run_start',
        nodeIds: nodeOrder,
        total: nodeOrder.length,
        branch: branchInfo,
      });

      for (let i = 0; i < nodeOrder.length; i++) {
        const nodeId = nodeOrder[i];
        const node = nodes.find(n => n.id === nodeId);

        send({
          type: 'node_start',
          nodeId,
          title: node?.title ?? 'Unknown',
          index: i + 1,
          total: nodeOrder.length,
        });

        try {
          const result = await runNode(keys, nodeId);
          send({
            type: 'node_complete',
            nodeId,
            status: result.status,
            output: result.output_data?.slice(0, 200),
            error: result.error_message,
          });

          // Stop if a node fails
          if (result.status === 'error') {
            send({ type: 'run_stopped', reason: 'error', failedNodeId: nodeId });
            break;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          send({ type: 'node_complete', nodeId, status: 'error', error: message });
          send({ type: 'run_stopped', reason: 'error', failedNodeId: nodeId });
          break;
        }
      }

      send({ type: 'run_complete' });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
};
