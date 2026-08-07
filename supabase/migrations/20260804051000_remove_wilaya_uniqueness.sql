-- Migration: Ensure public.profiles wilaya column is non-unique so multiple users (hotels & charities) can select the same Wilaya
DO $$
BEGIN
  -- Drop unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_wilaya_key' OR conname = 'profiles_wilaya_unique'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_wilaya_key;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_wilaya_unique;
  END IF;

  -- Drop unique index if it exists
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname IN ('profiles_wilaya_key', 'profiles_wilaya_unique', 'profiles_wilaya_idx_unique')
  ) THEN
    DROP INDEX IF EXISTS public.profiles_wilaya_key;
    DROP INDEX IF EXISTS public.profiles_wilaya_unique;
    DROP INDEX IF EXISTS public.profiles_wilaya_idx_unique;
  END IF;
END $$;
