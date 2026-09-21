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

CREATE TABLE IF NOT EXISTS telegram_sessions (
  chat_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  step TEXT NOT NULL,
  draft_data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS telegram_updates (
  update_id TEXT PRIMARY KEY,
  processed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS telegram_integrations (
  workspace_id TEXT PRIMARY KEY,
  bot_username TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  connected_at TEXT NOT NULL,
  last_error TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry
  ON oauth_states(expires_at);

CREATE INDEX IF NOT EXISTS idx_oauth_tickets_expiry
  ON oauth_tickets(expires_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expiry
  ON rate_limits(expires_at);

CREATE INDEX IF NOT EXISTS idx_telegram_sessions_workspace
  ON telegram_sessions(workspace_id);

CREATE INDEX IF NOT EXISTS idx_telegram_updates_time
  ON telegram_updates(processed_at);
