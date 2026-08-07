-- Migration: Add caisse_status column to public.food_requests table to track cash collection in admin caisse
ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS caisse_status TEXT NOT NULL DEFAULT 'pending';

-- Update existing completed requests if needed
UPDATE public.food_requests SET caisse_status = 'pending' WHERE caisse_status IS NULL;
