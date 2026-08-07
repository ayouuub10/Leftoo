CREATE POLICY "listing_photos_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listing-photos');
CREATE POLICY "listing_photos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing_photos_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing_photos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);