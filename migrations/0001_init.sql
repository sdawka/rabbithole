-- Rabbithole D1 schema

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS presets (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  model_id    TEXT NOT NULL,
  temperature REAL DEFAULT 0.7,
  max_tokens  INTEGER DEFAULT 2048,
  is_default  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workflows (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL DEFAULT 'Untitled Rabbit Hole',
  description    TEXT DEFAULT '',
  viewport_x     REAL DEFAULT 0,
  viewport_y     REAL DEFAULT 0,
  viewport_zoom  REAL DEFAULT 1,
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nodes (
  id            TEXT PRIMARY KEY,
  workflow_id   TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  node_type     TEXT NOT NULL,
  title         TEXT NOT NULL,
  position_x    REAL NOT NULL DEFAULT 0,
  position_y    REAL NOT NULL DEFAULT 0,
  width         REAL DEFAULT 280,
  preset_id     TEXT REFERENCES presets(id) ON DELETE SET NULL,
  system_prompt TEXT DEFAULT '',
  user_input    TEXT DEFAULT '',
  output_data   TEXT DEFAULT '',
  status        TEXT DEFAULT 'idle',
  error_message TEXT DEFAULT '',
  run_at        TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_nodes_workflow ON nodes(workflow_id);

CREATE TABLE IF NOT EXISTS edges (
  id            TEXT PRIMARY KEY,
  workflow_id   TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  source_node   TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_node   TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  source_handle TEXT DEFAULT 'output',
  target_handle TEXT DEFAULT 'input',
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_edges_workflow ON edges(workflow_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_edges_unique ON edges(source_node, target_node, source_handle, target_handle);

-- Seed default preset
INSERT OR IGNORE INTO presets (id, name, model_id, temperature, max_tokens, is_default)
VALUES ('default', 'Gemini Flash Lite', 'google/gemini-3.1-flash-lite-preview', 0.7, 16384, 1);
