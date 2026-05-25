-- 1. Restrict SELECT on private buckets (masters/normalized/exports) to admin/editor only.
DROP POLICY IF EXISTS "Authenticated read private buckets" ON storage.objects;

CREATE POLICY "Editor read private buckets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = ANY (ARRAY['masters'::text, 'normalized'::text, 'exports'::text])
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

-- 2. Tighten UPDATE on public buckets: artists may only update their own
--    objects (first path segment must equal their auth.uid()); editors/admins
--    keep full access.
DROP POLICY IF EXISTS "Public buckets update by non-viewer" ON storage.objects;

CREATE POLICY "Public buckets update by editor"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = ANY (ARRAY['artwork'::text, 'previews'::text, 'audio-previews'::text])
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
)
WITH CHECK (
  bucket_id = ANY (ARRAY['artwork'::text, 'previews'::text, 'audio-previews'::text])
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Public buckets update own by artist"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = ANY (ARRAY['artwork'::text, 'previews'::text, 'audio-previews'::text])
  AND has_role(auth.uid(), 'artist'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = ANY (ARRAY['artwork'::text, 'previews'::text, 'audio-previews'::text])
  AND has_role(auth.uid(), 'artist'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);