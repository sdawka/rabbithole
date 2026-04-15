-- Add branches table
CREATE TABLE IF NOT EXISTS branches (
  id           TEXT PRIMARY KEY,
  workflow_id  TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'main',
  parent_branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  fork_node_id TEXT REFERENCES nodes(id) ON DELETE SET NULL,
  color        TEXT DEFAULT '#6366f1',
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_branches_workflow ON branches(workflow_id);

-- Add branch reference to nodes
ALTER TABLE nodes ADD COLUMN branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE;

-- Track which node a branched node was cloned from
ALTER TABLE nodes ADD COLUMN source_node_id TEXT REFERENCES nodes(id) ON DELETE SET NULL;
