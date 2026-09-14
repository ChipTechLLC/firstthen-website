CREATE TABLE IF NOT EXISTS invitations (
  token_hash TEXT PRIMARY KEY,
  campaign TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1))
);
CREATE TABLE IF NOT EXISTS signups (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_model TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  member_status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS signups_pending ON signups(member_status, attempts, created_at);
