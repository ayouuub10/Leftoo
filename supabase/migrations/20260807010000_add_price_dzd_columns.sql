-- Migration: Ensure price_dzd, payment_method, and caisse_status exist on listings and food_requests

-- 1. Add price_dzd to public.listings
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS price_dzd NUMERIC DEFAULT 0;

-- 2. Add price_dzd to public.food_requests
ALTER TABLE public.food_requests 
ADD COLUMN IF NOT EXISTS price_dzd NUMERIC DEFAULT 0;

-- 3. Add payment_method to public.food_requests
ALTER TABLE public.food_requests 
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'espece';

-- 4. Add caisse_status to public.food_requests
ALTER TABLE public.food_requests 
ADD COLUMN IF NOT EXISTS caisse_status TEXT NOT NULL DEFAULT 'pending';

-- 5. Backfill/sync price_dzd on food_requests from listings if missing
UPDATE public.food_requests fr
SET price_dzd = l.price_dzd
FROM public.listings l
WHERE fr.listing_id = l.id AND (fr.price_dzd IS NULL OR fr.price_dzd = 0) AND l.price_dzd IS NOT NULL;

-- 6. Ensure no null values exist
UPDATE public.listings SET price_dzd = 0 WHERE price_dzd IS NULL;
UPDATE public.food_requests SET price_dzd = 0 WHERE price_dzd IS NULL;
UPDATE public.food_requests SET payment_method = 'espece' WHERE payment_method IS NULL;
UPDATE public.food_requests SET caisse_status = 'pending' WHERE caisse_status IS NULL;
