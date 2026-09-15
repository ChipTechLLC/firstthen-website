CREATE TABLE IF NOT EXISTS beta_notifications (
  signup_id TEXT NOT NULL REFERENCES signups(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('welcome','launch')),
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  provider_id TEXT,
  last_error TEXT,
  PRIMARY KEY(signup_id,kind)
);
CREATE INDEX IF NOT EXISTS beta_notifications_pending ON beta_notifications(status,next_attempt_at);
CREATE TABLE IF NOT EXISTS beta_email_budget (
  day TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0
);
