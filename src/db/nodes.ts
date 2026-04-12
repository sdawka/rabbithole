import type { D1Database } from '@cloudflare/workers-types';
import { nanoid } from 'nanoid';
import type { NodeRecord } from '../types/index.js';

export async function getNode(db: D1Database, id: string): Promise<NodeRecord | undefined> {
  const row = await db.prepare('SELECT * FROM nodes WHERE id = ?').bind(id).first<NodeRecord>();
  return row ?? undefined;
}

export async function createNode(db: D1Database, data: {
  workflow_id: string;
  node_type: string;
  title: string;
  position_x: number;
  position_y: number;
  system_prompt?: string;
  user_input?: string;
  preset_id?: string | null;
}): Promise<NodeRecord> {
  const id = nanoid(12);
  await db.prepare(
    `INSERT INTO nodes (id, workflow_id, node_type, title, position_x, position_y, system_prompt, user_input, preset_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, data.workflow_id, data.node_type, data.title, data.position_x, data.position_y, data.system_prompt ?? '', data.user_input ?? '', data.preset_id ?? null).run();
  return (await getNode(db, id))!;
}

export async function updateNode(db: D1Database, id: string, data: Partial<{
  title: string;
  position_x: number;
  position_y: number;
  width: number;
  preset_id: string | null;
  system_prompt: string;
  user_input: string;
  output_data: string;
  status: string;
  error_message: string;
  run_at: string | null;
}>): Promise<NodeRecord | undefined> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return getNode(db, id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db.prepare(`UPDATE nodes SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return getNode(db, id);
}

export async function deleteNode(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM nodes WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function getUpstreamOutputs(db: D1Database, nodeId: string): Promise<{ handle: string; output: string; sourceNodeId: string }[]> {
  const { results } = await db.prepare(`
    SELECT e.target_handle as handle, n.output_data as output, n.id as sourceNodeId
    FROM edges e
    JOIN nodes n ON n.id = e.source_node
    WHERE e.target_node = ?
  `).bind(nodeId).all<{ handle: string; output: string; sourceNodeId: string }>();
  return results;
}
