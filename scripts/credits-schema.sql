-- Credits ledger. Apply with:  bun run scripts/credits-migrate.mjs
--
-- The ledger is the source of truth; credit_accounts.balance is a cache that
-- must always be recomputable from it. Never UPDATE or DELETE a ledger row —
-- a reversal is a new compensating row.

CREATE TABLE IF NOT EXISTS credit_ledger (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT    NOT NULL,
  delta           INTEGER NOT NULL,           -- + earned, - spent/reversed
  reason          TEXT    NOT NULL,           -- survey_complete | survey_screenout | spend | reversal | signup_bonus | manual
  feature         TEXT,                       -- for spends: chat | news | premium_action
  provider        TEXT,                       -- cpx | ...
  provider_txn_id TEXT,
  net_revenue_usd REAL,                       -- what the network paid US, before our share
  metadata        TEXT,                       -- JSON blob
  created_at      INTEGER NOT NULL
);

-- The whole idempotency guarantee for postbacks. Networks retry, and they
-- will double-fire; this is what stops a retry paying twice.
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_txn
  ON credit_ledger(provider, provider_txn_id)
  WHERE provider_txn_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS credit_ledger_user ON credit_ledger(user_id, id DESC);

CREATE TABLE IF NOT EXISTS credit_accounts (
  user_id         TEXT    PRIMARY KEY,
  balance         INTEGER NOT NULL DEFAULT 0, -- may go negative after a reversal
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent  INTEGER NOT NULL DEFAULT 0,
  reversals       INTEGER NOT NULL DEFAULT 0, -- serial reversals = fraud signal
  updated_at      INTEGER NOT NULL
);

-- Free daily allowance, counted per user per feature per UTC day.
CREATE TABLE IF NOT EXISTS feature_usage (
  user_id TEXT    NOT NULL,
  feature TEXT    NOT NULL,
  day     TEXT    NOT NULL,                   -- YYYY-MM-DD, UTC
  used    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, feature, day)
);
