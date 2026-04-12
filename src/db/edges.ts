import type { D1Database } from '@cloudflare/workers-types';
import { nanoid } from 'nanoid';
import type { EdgeRecord } from '../types/index.js';

export async function createEdge(db: D1Database, data: {
  workflow_id: string;
  source_node: string;
  target_node: string;
  source_handle?: string;
  target_handle?: string;
}): Promise<EdgeRecord> {
  const id = nanoid(12);
  await db.prepare(
    `INSERT INTO edges (id, workflow_id, source_node, target_node, source_handle, target_handle)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, data.workflow_id, data.source_node, data.target_node, data.source_handle ?? 'output', data.target_handle ?? 'input').run();
  const row = await db.prepare('SELECT * FROM edges WHERE id = ?').bind(id).first<EdgeRecord>();
  return row!;
}

export async function deleteEdge(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM edges WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function getEdgesByWorkflow(db: D1Database, workflowId: string): Promise<EdgeRecord[]> {
  const { results } = await db.prepare('SELECT * FROM edges WHERE workflow_id = ?').bind(workflowId).all<EdgeRecord>();
  return results;
}
