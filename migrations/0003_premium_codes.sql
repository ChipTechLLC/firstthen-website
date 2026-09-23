CREATE TABLE IF NOT EXISTS beta_premium_codes (
 signup_id TEXT PRIMARY KEY REFERENCES signups(id) ON DELETE CASCADE,
 code TEXT NOT NULL UNIQUE,
 promotion_id TEXT NOT NULL,
 activates_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 updated_at INTEGER NOT NULL,
 provider_id TEXT,
 last_error TEXT
);
