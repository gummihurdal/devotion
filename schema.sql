-- ============================================================
-- THE ETERNAL WORD — Devotional Table
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS devotionals (
  id                   SERIAL PRIMARY KEY,
  month_day            TEXT UNIQUE NOT NULL,  -- "01-01" through "12-31" (cycles yearly)
  scripture_reference  TEXT NOT NULL,
  scripture_text       TEXT NOT NULL,
  theme                TEXT NOT NULL,
  meditation           TEXT NOT NULL,         -- paragraphs separated by \n\n
  quote_text           TEXT NOT NULL,
  quote_author         TEXT NOT NULL,
  reflection_questions JSONB NOT NULL,        -- [{topic, question}, {topic, question}, ...]
  prayer               TEXT NOT NULL,
  call_to_action       TEXT NOT NULL,
  sources              TEXT[] NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Enable public read access (no auth needed to read devotionals)
ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access"
  ON devotionals FOR SELECT
  USING (true);

-- Index for fast date lookup
CREATE INDEX IF NOT EXISTS idx_devotionals_month_day ON devotionals(month_day);

-- Verify
SELECT COUNT(*) FROM devotionals;
