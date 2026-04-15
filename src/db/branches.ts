import { getDb } from './index.js';
import { nanoid } from 'nanoid';
import type { Branch, NodeRecord, EdgeRecord } from '../types/index.js';

export async function getBranch(id: string): Promise<Branch | undefined> {
  const row = await getDb().prepare('SELECT * FROM branches WHERE id = ?').bind(id).first<Branch>();
  return row ?? undefined;
}

export async function getBranchesForWorkflow(workflowId: string): Promise<Branch[]> {
  const { results } = await getDb().prepare(
    'SELECT * FROM branches WHERE workflow_id = ? ORDER BY created_at'
  ).bind(workflowId).all<Branch>();
  return results;
}

export async function createBranch(data: {
  workflow_id: string;
  name: string;
  parent_branch_id?: string | null;
  fork_node_id?: string | null;
  color?: string;
}): Promise<Branch> {
  const id = nanoid(12);
  await getDb().prepare(
    `INSERT INTO branches (id, workflow_id, name, parent_branch_id, fork_node_id, color)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    data.workflow_id,
    data.name,
    data.parent_branch_id ?? null,
    data.fork_node_id ?? null,
    data.color ?? '#6366f1'
  ).run();
  return (await getBranch(id))!;
}

export async function updateBranch(id: string, data: Partial<{
  name: string;
  color: string;
}>): Promise<Branch | undefined> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return getBranch(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await getDb().prepare(`UPDATE branches SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return getBranch(id);
}

export async function deleteBranch(id: string): Promise<boolean> {
  const result = await getDb().prepare('DELETE FROM branches WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function getOrCreateMainBranch(workflowId: string): Promise<Branch> {
  const existing = await getDb().prepare(
    "SELECT * FROM branches WHERE workflow_id = ? AND name = 'main'"
  ).bind(workflowId).first<Branch>();

  if (existing) return existing;

  return createBranch({
    workflow_id: workflowId,
    name: 'main',
    color: '#6366f1',
  });
}

/**
 * Create a new branch by forking from a specific node.
 * Clones the fork node and all downstream nodes into the new branch.
 */
export async function forkBranch(data: {
  workflow_id: string;
  fork_node_id: string;
  branch_name: string;
  parent_branch_id: string;
}): Promise<{
  branch: Branch;
  clonedNodes: NodeRecord[];
  clonedEdges: EdgeRecord[];
}> {
  const db = getDb();

  // Count existing branches to determine offset direction
  const { results: existingBranches } = await db.prepare(
    'SELECT id FROM branches WHERE workflow_id = ?'
  ).bind(data.workflow_id).all();
  const branchIndex = existingBranches.length;

  // Alternate up/down with slight diagonal: odd branches go up, even go down
  const direction = branchIndex % 2 === 0 ? -1 : 1;
  const yOffset = direction * 150; // Up or down
  const xOffset = 80; // Slight rightward diagonal

  // Create the new branch
  const branch = await createBranch({
    workflow_id: data.workflow_id,
    name: data.branch_name,
    parent_branch_id: data.parent_branch_id,
    fork_node_id: data.fork_node_id,
    color: generateBranchColor(),
  });

  // Get all nodes and edges in the workflow for the parent branch
  const { results: allNodes } = await db.prepare(
    'SELECT * FROM nodes WHERE workflow_id = ? AND (branch_id = ? OR branch_id IS NULL)'
  ).bind(data.workflow_id, data.parent_branch_id).all<NodeRecord>();

  const { results: allEdges } = await db.prepare(
    'SELECT * FROM edges WHERE workflow_id = ?'
  ).bind(data.workflow_id).all<EdgeRecord>();

  // Build adjacency list for downstream traversal
  const outgoing = new Map<string, string[]>();
  for (const edge of allEdges) {
    if (!outgoing.has(edge.source_node)) outgoing.set(edge.source_node, []);
    outgoing.get(edge.source_node)!.push(edge.target_node);
  }

  // Find all downstream nodes (BFS from fork point)
  const nodeIds = new Set(allNodes.map(n => n.id));
  const downstream = new Set<string>();
  const queue = [data.fork_node_id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (downstream.has(current) || !nodeIds.has(current)) continue;
    downstream.add(current);
    for (const next of outgoing.get(current) ?? []) {
      queue.push(next);
    }
  }

  // Clone downstream nodes
  const nodeIdMap = new Map<string, string>(); // old id -> new id
  const clonedNodes: NodeRecord[] = [];

  for (const node of allNodes) {
    if (!downstream.has(node.id)) continue;

    const newId = nanoid(12);
    nodeIdMap.set(node.id, newId);

    await db.prepare(
      `INSERT INTO nodes (id, workflow_id, branch_id, source_node_id, node_type, title,
       position_x, position_y, width, preset_id, system_prompt, user_input, output_data, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 'idle', '')`
    ).bind(
      newId,
      data.workflow_id,
      branch.id,
      node.id, // source_node_id points to original
      node.node_type,
      node.title,
      node.position_x + xOffset,
      node.position_y + yOffset,
      node.width,
      node.preset_id,
      node.system_prompt,
      node.user_input
    ).run();

    const cloned = await db.prepare('SELECT * FROM nodes WHERE id = ?').bind(newId).first<NodeRecord>();
    if (cloned) clonedNodes.push(cloned);
  }

  // Clone edges between downstream nodes
  const clonedEdges: EdgeRecord[] = [];
  for (const edge of allEdges) {
    const newSource = nodeIdMap.get(edge.source_node);
    const newTarget = nodeIdMap.get(edge.target_node);

    // Only clone edges where both endpoints are in the cloned set
    if (newSource && newTarget) {
      const newEdgeId = nanoid(12);
      await db.prepare(
        `INSERT INTO edges (id, workflow_id, source_node, target_node, source_handle, target_handle)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(newEdgeId, data.workflow_id, newSource, newTarget, edge.source_handle, edge.target_handle).run();

      const cloned = await db.prepare('SELECT * FROM edges WHERE id = ?').bind(newEdgeId).first<EdgeRecord>();
      if (cloned) clonedEdges.push(cloned);
    }
  }

  // Create edges from upstream (non-cloned) nodes to the cloned fork node
  for (const edge of allEdges) {
    if (edge.target_node === data.fork_node_id && !downstream.has(edge.source_node)) {
      const newTarget = nodeIdMap.get(edge.target_node);
      if (newTarget) {
        const newEdgeId = nanoid(12);
        await db.prepare(
          `INSERT INTO edges (id, workflow_id, source_node, target_node, source_handle, target_handle)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(newEdgeId, data.workflow_id, edge.source_node, newTarget, edge.source_handle, edge.target_handle).run();

        const cloned = await db.prepare('SELECT * FROM edges WHERE id = ?').bind(newEdgeId).first<EdgeRecord>();
        if (cloned) clonedEdges.push(cloned);
      }
    }
  }

  return { branch, clonedNodes, clonedEdges };
}

const BRANCH_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

let colorIndex = 0;
function generateBranchColor(): string {
  const color = BRANCH_COLORS[colorIndex % BRANCH_COLORS.length];
  colorIndex++;
  return color;
}
