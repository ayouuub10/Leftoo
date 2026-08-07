-- ENUMS
CREATE TYPE public.app_role AS ENUM ('hotel','charity','admin');
CREATE TYPE public.listing_status AS ENUM ('available','reserved','collected','expired');
CREATE TYPE public.request_status AS ENUM ('pending','accepted','rejected','completed','cancelled');
CREATE TYPE public.food_category AS ENUM ('cooked','bakery','produce','dairy','packaged','beverages','other');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  org_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  wilaya TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- LISTINGS
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category public.food_category NOT NULL DEFAULT 'cooked',
  quantity_kg NUMERIC,
  meals_count INTEGER NOT NULL DEFAULT 1,
  pickup_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  pickup_to TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '6 hours'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 day'),
  address TEXT,
  wilaya TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_url TEXT,
  notes TEXT,
  status public.listing_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX listings_hotel_idx ON public.listings(hotel_id);
CREATE INDEX listings_status_idx ON public.listings(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- REQUESTS
CREATE TABLE public.food_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, charity_id)
);
CREATE INDEX food_requests_charity_idx ON public.food_requests(charity_id);
CREATE INDEX food_requests_hotel_idx ON public.food_requests(hotel_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_requests TO authenticated;
GRANT ALL ON public.food_requests TO service_role;
ALTER TABLE public.food_requests ENABLE ROW LEVEL SECURITY;

-- FAVORITES
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, is_read);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- POLICIES: profiles
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_authenticated_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- POLICIES: user_roles
CREATE POLICY "roles_self_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- POLICIES: listings
CREATE POLICY "listings_hotel_all" ON public.listings FOR ALL TO authenticated
  USING (auth.uid() = hotel_id) WITH CHECK (auth.uid() = hotel_id AND public.has_role(auth.uid(),'hotel'));
CREATE POLICY "listings_read_all" ON public.listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "listings_admin_manage" ON public.listings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- POLICIES: requests
CREATE POLICY "requests_charity_insert" ON public.food_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = charity_id AND public.has_role(auth.uid(),'charity'));
CREATE POLICY "requests_involved_select" ON public.food_requests FOR SELECT TO authenticated
  USING (auth.uid() = charity_id OR auth.uid() = hotel_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "requests_involved_update" ON public.food_requests FOR UPDATE TO authenticated
  USING (auth.uid() = charity_id OR auth.uid() = hotel_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = charity_id OR auth.uid() = hotel_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "requests_charity_delete" ON public.food_requests FOR DELETE TO authenticated
  USING (auth.uid() = charity_id OR public.has_role(auth.uid(),'admin'));

-- POLICIES: favorites
CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- POLICIES: notifications
CREATE POLICY "notifications_own_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_own_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_insert_any" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- TIMESTAMPS
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER listings_touch BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER requests_touch BEFORE UPDATE ON public.food_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- NEW USER HANDLER
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, org_name, phone, wilaya)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.raw_user_meta_data->>'org_name',''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'wilaya'
  ) ON CONFLICT (id) DO NOTHING;

  _role := CASE WHEN NEW.raw_user_meta_data->>'role' = 'hotel' THEN 'hotel'::public.app_role
                WHEN NEW.raw_user_meta_data->>'role' = 'charity' THEN 'charity'::public.app_role
                ELSE 'charity'::public.app_role END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;