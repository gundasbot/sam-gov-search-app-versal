-- Migration: add tables that exist in schema but were never migrated to production
-- All statements use IF NOT EXISTS / EXCEPTION handling so they are idempotent.

-- ── 1. AlertFrequency enum ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "AlertFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'AS_CHANGES', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. saved_opportunities ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
  id                  TEXT        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             TEXT        NOT NULL,
  notice_id           TEXT        NOT NULL,
  title               TEXT,
  solicitation_number TEXT,
  department          TEXT,
  organization_name   TEXT,
  posted_date         TIMESTAMP(3),
  response_deadline   TIMESTAMP(3),
  naics_code          TEXT,
  type                TEXT,
  set_aside           TEXT,
  place_of_performance JSONB,
  ui_link             TEXT,
  created_at          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opportunity_type    TEXT,
  updated_at          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT saved_opportunities_user_id_notice_id_key UNIQUE (user_id, notice_id)
);

-- ── 3. saved_searches_v2 (required by alert_subscriptions FK) ────────────────
CREATE TABLE IF NOT EXISTS public.saved_searches_v2 (
  id                   TEXT        NOT NULL PRIMARY KEY,
  created_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id              TEXT        NOT NULL,
  name                 TEXT        NOT NULL,
  description          TEXT,
  keywords             TEXT,
  naics                TEXT,
  agency               TEXT,
  set_aside            TEXT,
  state_of_performance TEXT,
  posted_after         TEXT,
  posted_before        TEXT,
  procurement_type     TEXT        DEFAULT 'o',
  last_used_at         TIMESTAMP(3),
  use_count            INTEGER     NOT NULL DEFAULT 0,
  CONSTRAINT saved_searches_v2_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS saved_searches_v2_user_id_idx
  ON public.saved_searches_v2 (user_id);
CREATE INDEX IF NOT EXISTS saved_searches_v2_user_id_updated_at_idx
  ON public.saved_searches_v2 (user_id, updated_at);

-- ── 4. saved_searches_new ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_searches_new (
  id                       TEXT        NOT NULL PRIMARY KEY,
  user_id                  TEXT        NOT NULL,
  name                     TEXT        NOT NULL,
  description              TEXT,
  is_pinned                BOOLEAN     NOT NULL DEFAULT false,
  keywords                 TEXT,
  naics                    TEXT,
  agency                   TEXT,
  set_aside                TEXT,
  state_of_performance     TEXT,
  procurement_type         TEXT        NOT NULL DEFAULT 'o',
  is_active                TEXT,
  posted_after             TIMESTAMP(3),
  posted_before            TIMESTAMP(3),
  rdl_from                 TIMESTAMP(3),
  rdl_to                   TIMESTAMP(3),
  solicitation_number      TEXT,
  notice_id                TEXT,
  classification_code      TEXT,
  organization_code        TEXT,
  place_of_performance_zip TEXT,
  opportunity_status       TEXT,
  subscription_enabled     BOOLEAN     NOT NULL DEFAULT false,
  frequency                "AlertFrequency",
  email_notification       BOOLEAN     NOT NULL DEFAULT false,
  send_empty_results       BOOLEAN     NOT NULL DEFAULT false,
  max_results              INTEGER     NOT NULL DEFAULT 100,
  recipients               TEXT,
  delivery_time            TEXT,
  export_format            TEXT        NOT NULL DEFAULT 'XLSB',
  include_links            BOOLEAN     NOT NULL DEFAULT true,
  last_run_at              TIMESTAMP(3),
  last_result_count        INTEGER,
  created_at               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isPaused"               BOOLEAN     NOT NULL DEFAULT false,
  "pausedUntil"            TIMESTAMP(3),
  "pausedAt"               TIMESTAMP(3),
  "lastRunAt"              TIMESTAMP(3),
  "lastRunStatus"          TEXT,
  "lastRunCount"           INTEGER,
  "totalRuns"              INTEGER     NOT NULL DEFAULT 0,
  "totalEmailsSent"        INTEGER     NOT NULL DEFAULT 0,
  CONSTRAINT saved_searches_new_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS saved_searches_new_user_id_idx
  ON public.saved_searches_new (user_id);
CREATE INDEX IF NOT EXISTS saved_searches_new_user_id_subscription_enabled_idx
  ON public.saved_searches_new (user_id, subscription_enabled);
CREATE INDEX IF NOT EXISTS saved_searches_new_user_id_updated_at_idx
  ON public.saved_searches_new (user_id, updated_at);

-- ── 5. alert_subscriptions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alert_subscriptions (
  id                      TEXT        NOT NULL PRIMARY KEY,
  created_at              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id                 TEXT        NOT NULL,
  saved_search_id         TEXT,
  name                    TEXT        NOT NULL,
  description             TEXT,
  recipients              TEXT        NOT NULL,
  email_notification      BOOLEAN     NOT NULL DEFAULT true,
  send_empty_results      BOOLEAN     NOT NULL DEFAULT false,
  frequency               "AlertFrequency" NOT NULL DEFAULT 'DAILY',
  delivery_time           TEXT,
  export_format           TEXT        NOT NULL DEFAULT 'csv',
  include_links           BOOLEAN     NOT NULL DEFAULT false,
  include_attachments     BOOLEAN     NOT NULL DEFAULT true,
  include_results_in_body BOOLEAN     NOT NULL DEFAULT true,
  max_results             INTEGER     NOT NULL DEFAULT 100,
  active                  BOOLEAN     NOT NULL DEFAULT true,
  last_run_at             TIMESTAMP(3),
  last_result_count       INTEGER,
  last_error              TEXT,
  CONSTRAINT alert_subscriptions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT alert_subscriptions_saved_search_id_fkey
    FOREIGN KEY (saved_search_id) REFERENCES public.saved_searches_v2(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS alert_subscriptions_user_id_active_idx
  ON public.alert_subscriptions (user_id, active);
CREATE INDEX IF NOT EXISTS alert_subscriptions_user_id_idx
  ON public.alert_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS alert_subscriptions_saved_search_id_idx
  ON public.alert_subscriptions (saved_search_id);

-- ── 6. offer_codes.trial_days column ─────────────────────────────────────────
ALTER TABLE public.offer_codes
  ADD COLUMN IF NOT EXISTS trial_days INTEGER;
