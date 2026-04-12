import type { D1Database } from '@cloudflare/workers-types';
import { nanoid } from 'nanoid';
import type { Preset, Settings } from '../types/index.js';

export async function getSetting(db: D1Database, key: string): Promise<string | undefined> {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
  return row?.value;
}

export async function setSetting(db: D1Database, key: string, value: string): Promise<void> {
  await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, value).run();
}

export async function getAllSettings(db: D1Database): Promise<Partial<Settings>> {
  const { results: rows } = await db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings as Partial<Settings>;
}

export async function listPresets(db: D1Database): Promise<Preset[]> {
  const { results } = await db.prepare('SELECT * FROM presets ORDER BY name').all<Preset>();
  return results;
}

export async function getPreset(db: D1Database, id: string): Promise<Preset | undefined> {
  const row = await db.prepare('SELECT * FROM presets WHERE id = ?').bind(id).first<Preset>();
  return row ?? undefined;
}

export async function createPreset(db: D1Database, data: { name: string; model_id: string; temperature?: number; max_tokens?: number; is_default?: number }): Promise<Preset> {
  const id = nanoid(12);
  if (data.is_default) {
    await db.prepare('UPDATE presets SET is_default = 0').run();
  }
  await db.prepare(
    'INSERT INTO presets (id, name, model_id, temperature, max_tokens, is_default) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, data.name, data.model_id, data.temperature ?? 0.7, data.max_tokens ?? 2048, data.is_default ?? 0).run();
  return (await getPreset(db, id))!;
}

export async function updatePreset(db: D1Database, id: string, data: Partial<{ name: string; model_id: string; temperature: number; max_tokens: number; is_default: number }>): Promise<Preset | undefined> {
  if (data.is_default) {
    await db.prepare('UPDATE presets SET is_default = 0').run();
  }
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return getPreset(db, id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db.prepare(`UPDATE presets SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return getPreset(db, id);
}

export async function deletePreset(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM presets WHERE id = ?').bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function getDefaultPreset(db: D1Database): Promise<Preset | undefined> {
  const row = await db.prepare('SELECT * FROM presets WHERE is_default = 1').first<Preset>();
  return row ?? undefined;
}
