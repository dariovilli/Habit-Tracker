-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is safe to run multiple times (IF NOT EXISTS / DO $$ guards).
--
-- Addresses audit items 2.1–2.4:
--   2.1  RLS enabled on every table
--   2.2  Policies exist for all four operations (SELECT / INSERT / UPDATE / DELETE)
--   2.3  INSERT and UPDATE policies include WITH CHECK so a user cannot write rows
--         with another user's user_id
--   2.4  Identity is always auth.uid() — never the mutable user_metadata field

-- ─── habits ──────────────────────────────────────────────────────────────────

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'habits_select_own'
  ) THEN
    CREATE POLICY habits_select_own ON habits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'habits_insert_own'
  ) THEN
    CREATE POLICY habits_insert_own ON habits
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'habits_update_own'
  ) THEN
    CREATE POLICY habits_update_own ON habits
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habits' AND policyname = 'habits_delete_own'
  ) THEN
    CREATE POLICY habits_delete_own ON habits
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── habit_logs ──────────────────────────────────────────────────────────────

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habit_logs' AND policyname = 'habit_logs_select_own'
  ) THEN
    CREATE POLICY habit_logs_select_own ON habit_logs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habit_logs' AND policyname = 'habit_logs_insert_own'
  ) THEN
    CREATE POLICY habit_logs_insert_own ON habit_logs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habit_logs' AND policyname = 'habit_logs_update_own'
  ) THEN
    CREATE POLICY habit_logs_update_own ON habit_logs
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'habit_logs' AND policyname = 'habit_logs_delete_own'
  ) THEN
    CREATE POLICY habit_logs_delete_own ON habit_logs
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── challenges ──────────────────────────────────────────────────────────────

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'challenges_select_own'
  ) THEN
    CREATE POLICY challenges_select_own ON challenges
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'challenges_insert_own'
  ) THEN
    CREATE POLICY challenges_insert_own ON challenges
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'challenges_update_own'
  ) THEN
    CREATE POLICY challenges_update_own ON challenges
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'challenges_delete_own'
  ) THEN
    CREATE POLICY challenges_delete_own ON challenges
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
