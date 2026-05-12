-- Make saved_opportunities match the Prisma model even when the table existed
-- before the idempotent table-creation migration was introduced.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.saved_opportunities
  ADD COLUMN IF NOT EXISTS id TEXT,
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS notice_id TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS solicitation_number TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS organization_name TEXT,
  ADD COLUMN IF NOT EXISTS posted_date TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS naics_code TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS set_aside TEXT,
  ADD COLUMN IF NOT EXISTS place_of_performance JSONB,
  ADD COLUMN IF NOT EXISTS ui_link TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS opportunity_type TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.saved_opportunities
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

UPDATE public.saved_opportunities
SET id = gen_random_uuid()::text
WHERE id IS NULL;

ALTER TABLE public.saved_opportunities
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN notice_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'saved_opportunities_pkey'
      AND conrelid = 'public.saved_opportunities'::regclass
  ) THEN
    ALTER TABLE public.saved_opportunities
      ADD CONSTRAINT saved_opportunities_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'saved_opportunities_user_id_notice_id_key'
      AND conrelid = 'public.saved_opportunities'::regclass
  ) THEN
    ALTER TABLE public.saved_opportunities
      ADD CONSTRAINT saved_opportunities_user_id_notice_id_key UNIQUE (user_id, notice_id);
  END IF;
END $$;
