-- Drop overly broad storage policies
DROP POLICY IF EXISTS "Authenticated insert app buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update app buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public read artwork" ON storage.objects;
DROP POLICY IF EXISTS "Public read previews" ON storage.objects;

-- Public buckets: any authenticated user can insert/update
CREATE POLICY "Auth insert public buckets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('artwork','previews'));

CREATE POLICY "Auth update public buckets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('artwork','previews'))
WITH CHECK (bucket_id IN ('artwork','previews'));

-- Private buckets: admin or editor only
CREATE POLICY "Editor insert private buckets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('masters','normalized','exports')
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);

CREATE POLICY "Editor update private buckets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('masters','normalized','exports')
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
)
WITH CHECK (
  bucket_id IN ('masters','normalized','exports')
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
);