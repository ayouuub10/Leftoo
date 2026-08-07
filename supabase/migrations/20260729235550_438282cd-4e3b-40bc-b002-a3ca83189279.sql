ALTER TABLE public.listings
  ADD CONSTRAINT listings_hotel_profile_fkey FOREIGN KEY (hotel_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.food_requests
  ADD CONSTRAINT food_requests_charity_profile_fkey FOREIGN KEY (charity_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.food_requests
  ADD CONSTRAINT food_requests_hotel_profile_fkey FOREIGN KEY (hotel_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.favorites
  ADD CONSTRAINT favorites_listing_fkey2 FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;