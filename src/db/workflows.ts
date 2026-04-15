import { getDb } from './index.js';
import { nanoid } from 'nanoid';
import type { Workflow, WorkflowFull, NodeRecord, EdgeRecord, Branch } from '../types/index.js';

export async function listWorkflows(): Promise<Workflow[]> {
  const { results } = await getDb().prepare('SELECT * FROM workflows ORDER BY updated_at DESC').all<Workflow>();
  return results;
}

export async function getWorkflow(id: string): Promise<WorkflowFull | undefined> {
  const db = getDb();
  const workflow = await db.prepare('SELECT * FROM workflows WHERE id = ?').bind(id).first<Workflow>();
  if (!workflow) return undefined;
  const { results: nodes } = await db.prepare('SELECT * FROM nodes WHERE workflow_id = ?').bind(id).all<NodeRecord>();
  const { results: edges } = await db.prepare('SELECT * FROM edges WHERE workflow_id = ?').bind(id).all<EdgeRecord>();
  const { results: branches } = await db.prepare('SELECT * FROM branches WHERE workflow_id = ? ORDER BY created_at').bind(id).all<Branch>();
  return { ...workflow, nodes, edges, branches };
}

export async function createWorkflow(data?: Partial<{ name: string; description: string }>): Promise<Workflow> {
  const id = nanoid(12);
  const db = getDb();
  await db.prepare(
    'INSERT INTO workflows (id, name, description) VALUES (?, ?, ?)'
  ).bind(id, data?.name ?? 'Untitled Rabbit Hole', data?.description ?? '').run();
  const row = await db.prepare('SELECT * FROM workflows WHERE id = ?').bind(id).first<Workflow>();
  return row!;
}

export async function updateWorkflow(id: string, data: Partial<{ name: string; description: string; viewport_x: number; viewport_y: number; viewport_zoom: number }>): Promise<Workflow | undefined> {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) {
    const row = await db.prepare('SELECT * FROM workflows WHERE id = ?').bind(id).first<Workflow>();
    return row ?? undefined;
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db.prepare(`UPDATE workflows SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const row = await db.prepare('SELECT * FROM workflows WHERE id = ?').bind(id).first<Workflow>();
  return row ?? undefined;
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  const result = await getDb().prepare('DELETE FROM workflows WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}
