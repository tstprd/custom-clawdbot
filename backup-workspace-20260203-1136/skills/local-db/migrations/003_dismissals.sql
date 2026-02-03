-- Dismissals table for tracking dismissed emails, tasks, reminders
-- Prevents repeated alerts for items user has already acknowledged

CREATE TABLE IF NOT EXISTS dismissals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  subject TEXT,
  dismissed_at TEXT DEFAULT (datetime('now')),
  remind_after TEXT,
  reason TEXT,
  UNIQUE(type, external_id)
);

CREATE INDEX IF NOT EXISTS idx_dismissals_type ON dismissals(type);
CREATE INDEX IF NOT EXISTS idx_dismissals_remind ON dismissals(remind_after);
