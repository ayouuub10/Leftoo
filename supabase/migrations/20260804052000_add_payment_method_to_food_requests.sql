-- Migration: Add payment_method column to public.food_requests table
ALTER TABLE public.food_requests 
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'espece';

-- Ensure existing records have 'espece' set
UPDATE public.food_requests 
SET payment_method = 'espece' 
WHERE payment_method IS NULL;
