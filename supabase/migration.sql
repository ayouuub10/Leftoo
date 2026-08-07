-- ====================================================================
-- LEFTO SUPABASE DATABASE MIGRATION & SECURITY SCHEMA
-- Compatible with Lefto Algeria Surplus Food Marketplace
-- ====================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('hotel', 'charity', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.food_category AS ENUM ('cooked', 'bakery', 'produce', 'dairy', 'packaged', 'beverages', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM ('draft', 'available', 'reserved', 'collected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  org_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  wilaya TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  bio TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS org_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wilaya TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;


-- 3. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_id_role_key UNIQUE(user_id, role)
);


-- 4. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category public.food_category DEFAULT 'cooked',
  meals_count INT NOT NULL DEFAULT 1,
  quantity_kg NUMERIC DEFAULT 0,
  price_dzd NUMERIC DEFAULT 0,
  pickup_from TIMESTAMPTZ NOT NULL,
  pickup_to TIMESTAMPTZ NOT NULL,
  photo_url TEXT,
  address TEXT,
  wilaya TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  notes TEXT,
  status public.listing_status DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS price_dzd NUMERIC DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS quantity_kg NUMERIC DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS meals_count INT NOT NULL DEFAULT 1;


-- 5. FOOD REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.food_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.request_status DEFAULT 'pending',
  message TEXT,
  price_dzd NUMERIC DEFAULT 0,
  commission_dzd NUMERIC DEFAULT 0,
  hotel_net_dzd NUMERIC DEFAULT 0,
  qr_token TEXT,
  qr_expires_at TIMESTAMPTZ,
  qr_used_at TIMESTAMPTZ,
  payment_method TEXT NOT NULL DEFAULT 'espece',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS price_dzd NUMERIC DEFAULT 0;
ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS commission_dzd NUMERIC DEFAULT 0;
ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS hotel_net_dzd NUMERIC DEFAULT 0;
ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS qr_token TEXT;
ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS qr_expires_at TIMESTAMPTZ;
ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS qr_used_at TIMESTAMPTZ;
ALTER TABLE public.food_requests ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'espece';


-- 6. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT favorites_user_id_listing_id_key UNIQUE (user_id, listing_id)
);


-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 8. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_listings_hotel_id ON public.listings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_food_requests_charity ON public.food_requests(charity_id);
CREATE INDEX IF NOT EXISTS idx_food_requests_hotel ON public.food_requests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_food_requests_listing ON public.food_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_food_requests_status ON public.food_requests(status);
CREATE INDEX IF NOT EXISTS idx_food_requests_qr_token ON public.food_requests(qr_token);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);


-- 10. HELPER SECURITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- 11. AUTOMATIC NEW USER INITIALIZATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  -- Insert or update user profile (profiles table DOES NOT have a role column)
  INSERT INTO public.profiles (
    id,
    full_name,
    org_name,
    phone,
    wilaya,
    address
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'org_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'wilaya',
    NEW.raw_user_meta_data->>'address'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    org_name = EXCLUDED.org_name,
    phone = EXCLUDED.phone,
    wilaya = EXCLUDED.wilaya,
    address = EXCLUDED.address,
    updated_at = now();

  -- Assign user role in user_roles table
  _role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'hotel' THEN 'hotel'::public.app_role
    WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::public.app_role
    ELSE 'charity'::public.app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 12. SECURE RPC FUNCTION FOR QR VERIFICATION
CREATE OR REPLACE FUNCTION public.verify_and_complete_qr(
  p_request_id UUID,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_listing_title TEXT;
  v_commission NUMERIC;
  v_net NUMERIC;
BEGIN
  SELECT * INTO v_request 
  FROM public.food_requests 
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  IF v_request.status = 'completed' OR v_request.qr_used_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'QR code has already been used and verified');
  END IF;

  IF v_request.status != 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction is not in Accepted status');
  END IF;

  IF v_request.qr_token IS NULL OR v_request.qr_token != p_token THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid QR verification token');
  END IF;

  IF v_request.qr_expires_at IS NOT NULL AND v_request.qr_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'QR code has expired');
  END IF;

  v_commission := ROUND(COALESCE(v_request.price_dzd, 0) * 0.15, 2);
  v_net := COALESCE(v_request.price_dzd, 0) - v_commission;

  UPDATE public.food_requests
  SET 
    status = 'completed',
    qr_used_at = now(),
    commission_dzd = v_commission,
    hotel_net_dzd = v_net,
    updated_at = now()
  WHERE id = p_request_id;

  UPDATE public.listings
  SET 
    status = 'collected',
    updated_at = now()
  WHERE id = v_request.listing_id;

  SELECT title INTO v_listing_title FROM public.listings WHERE id = v_request.listing_id;

  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES 
    (v_request.hotel_id, 'تم تأكيد استلام الفائض بنجاح', COALESCE(v_listing_title, 'وجبة طعام'), 'success', '/requests/' || p_request_id),
    (v_request.charity_id, 'تمت عملية الاستلام بنجاح', COALESCE(v_listing_title, 'وجبة طعام'), 'success', '/requests/' || p_request_id);

  INSERT INTO public.activity_logs (user_id, user_role, action, details)
  VALUES (
    auth.uid(),
    'system',
    'qr_scanned_and_completed',
    jsonb_build_object(
      'request_id', p_request_id,
      'listing_id', v_request.listing_id,
      'price_dzd', v_request.price_dzd,
      'commission_dzd', v_commission,
      'hotel_net_dzd', v_net
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Transaction verified and completed successfully',
    'price_dzd', v_request.price_dzd,
    'commission_dzd', v_commission,
    'hotel_net_dzd', v_net
  );
END;
$$;


-- 13. TRIGGERS FOR TOUCH UPDATED_AT
DROP TRIGGER IF EXISTS profiles_touch ON public.profiles;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS listings_touch ON public.listings;
CREATE TRIGGER listings_touch BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS requests_touch ON public.food_requests;
CREATE TRIGGER requests_touch BEFORE UPDATE ON public.food_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- 14. ROW LEVEL SECURITY (RLS) & POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR public.has_role(auth.uid(), 'admin')
);

-- USER ROLES POLICIES
DROP POLICY IF EXISTS "roles_read" ON public.user_roles;
CREATE POLICY "roles_read" ON public.user_roles FOR SELECT USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "roles_admin_manage" ON public.user_roles;
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL USING (
  public.has_role(auth.uid(), 'admin')
);

-- LISTINGS POLICIES
DROP POLICY IF EXISTS "listings_read_all" ON public.listings;
CREATE POLICY "listings_read_all" ON public.listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "listings_hotel_insert" ON public.listings;
CREATE POLICY "listings_hotel_insert" ON public.listings FOR INSERT WITH CHECK (
  (auth.uid() = hotel_id AND public.has_role(auth.uid(), 'hotel')) OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "listings_hotel_update" ON public.listings;
CREATE POLICY "listings_hotel_update" ON public.listings FOR UPDATE USING (
  auth.uid() = hotel_id OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "listings_hotel_delete" ON public.listings;
CREATE POLICY "listings_hotel_delete" ON public.listings FOR DELETE USING (
  auth.uid() = hotel_id OR public.has_role(auth.uid(), 'admin')
);

-- FOOD REQUESTS POLICIES
DROP POLICY IF EXISTS "requests_select" ON public.food_requests;
CREATE POLICY "requests_select" ON public.food_requests FOR SELECT USING (
  auth.uid() = charity_id OR auth.uid() = hotel_id OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "requests_charity_insert" ON public.food_requests;
CREATE POLICY "requests_charity_insert" ON public.food_requests FOR INSERT WITH CHECK (
  (auth.uid() = charity_id AND public.has_role(auth.uid(), 'charity')) OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "requests_update" ON public.food_requests;
CREATE POLICY "requests_update" ON public.food_requests FOR UPDATE USING (
  auth.uid() = charity_id OR auth.uid() = hotel_id OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "requests_delete" ON public.food_requests;
CREATE POLICY "requests_delete" ON public.food_requests FOR DELETE USING (
  auth.uid() = charity_id OR public.has_role(auth.uid(), 'admin')
);

-- FAVORITES POLICIES
DROP POLICY IF EXISTS "favorites_all" ON public.favorites;
CREATE POLICY "favorites_all" ON public.favorites FOR ALL USING (
  auth.uid() = user_id
) WITH CHECK (
  auth.uid() = user_id
);

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);

-- ACTIVITY LOGS POLICIES
DROP POLICY IF EXISTS "activity_logs_select" ON public.activity_logs;
CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;
CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- REALTIME REPLICATION ENABLEMENT
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.food_requests;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Ensure public.profiles wilaya column has no UNIQUE constraint or index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_wilaya_key' OR conname = 'profiles_wilaya_unique'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_wilaya_key;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_wilaya_unique;
  END IF;

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

