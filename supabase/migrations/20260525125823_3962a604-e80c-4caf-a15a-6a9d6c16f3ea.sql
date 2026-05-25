
-- Create storage buckets (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('masters', 'masters', false),
  ('previews', 'previews', true),
  ('normalized', 'normalized', false),
  ('artwork', 'artwork', true),
  ('exports', 'exports', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Public read policies for artwork + previews
DROP POLICY IF EXISTS "Public read artwork" ON storage.objects;
CREATE POLICY "Public read artwork"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'artwork');

DROP POLICY IF EXISTS "Public read previews" ON storage.objects;
CREATE POLICY "Public read previews"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'previews');

-- Authenticated read for private buckets
DROP POLICY IF EXISTS "Authenticated read private buckets" ON storage.objects;
CREATE POLICY "Authenticated read private buckets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('masters', 'normalized', 'exports'));

-- Authenticated write for all app buckets
DROP POLICY IF EXISTS "Authenticated insert app buckets" ON storage.objects;
CREATE POLICY "Authenticated insert app buckets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('masters', 'previews', 'normalized', 'artwork', 'exports'));

DROP POLICY IF EXISTS "Authenticated update app buckets" ON storage.objects;
CREATE POLICY "Authenticated update app buckets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('masters', 'previews', 'normalized', 'artwork', 'exports'))
WITH CHECK (bucket_id IN ('masters', 'previews', 'normalized', 'artwork', 'exports'));

-- Admin can delete from any app bucket
DROP POLICY IF EXISTS "Admins delete app buckets" ON storage.objects;
CREATE POLICY "Admins delete app buckets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('masters', 'previews', 'normalized', 'artwork', 'exports')
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
