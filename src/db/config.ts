import { getDb } from './index.js';
import { nanoid } from 'nanoid';
import type { Preset } from '../types/index.js';

export async function listPresets(): Promise<Preset[]> {
  const { results } = await getDb().prepare('SELECT * FROM presets ORDER BY name').all<Preset>();
  return results;
}

export async function getPreset(id: string): Promise<Preset | undefined> {
  const row = await getDb().prepare('SELECT * FROM presets WHERE id = ?').bind(id).first<Preset>();
  return row ?? undefined;
}

export async function createPreset(data: { name: string; model_id: string; temperature?: number; max_tokens?: number; is_default?: number }): Promise<Preset> {
  const id = nanoid(12);
  const db = getDb();
  if (data.is_default) {
    await db.prepare('UPDATE presets SET is_default = 0').run();
  }
  await db.prepare(
    'INSERT INTO presets (id, name, model_id, temperature, max_tokens, is_default) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, data.name, data.model_id, data.temperature ?? 0.7, data.max_tokens ?? 2048, data.is_default ?? 0).run();
  return (await getPreset(id))!;
}

export async function updatePreset(id: string, data: Partial<{ name: string; model_id: string; temperature: number; max_tokens: number; is_default: number }>): Promise<Preset | undefined> {
  const db = getDb();
  if (data.is_default) {
    await db.prepare('UPDATE presets SET is_default = 0').run();
  }
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return getPreset(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db.prepare(`UPDATE presets SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return getPreset(id);
}

export async function deletePreset(id: string): Promise<boolean> {
  const result = await getDb().prepare('DELETE FROM presets WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function getDefaultPreset(): Promise<Preset | undefined> {
  const row = await getDb().prepare('SELECT * FROM presets WHERE is_default = 1').first<Preset>();
  return row ?? undefined;
}
