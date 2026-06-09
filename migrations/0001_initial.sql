CREATE TABLE IF NOT EXISTS workspace_snapshots (
  user_id TEXT PRIMARY KEY,
  workspace_data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_tickets (
  ticket TEXT PRIMARY KEY,
  profile_data TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry
  ON oauth_states(expires_at);

CREATE INDEX IF NOT EXISTS idx_oauth_tickets_expiry
  ON oauth_tickets(expires_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expiry
  ON rate_limits(expires_at);
