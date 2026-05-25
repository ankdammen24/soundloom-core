-- Remove overly permissive policies on public buckets
DROP POLICY IF EXISTS "Auth insert public buckets" ON storage.objects;
DROP POLICY IF EXISTS "Auth update public buckets" ON storage.objects;

-- Restrict INSERT on artwork/previews/audio-previews to admin/editor/artist
CREATE POLICY "Public buckets insert by non-viewer"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = ANY (ARRAY['artwork'::text, 'previews'::text, 'audio-previews'::text])
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
    OR has_role(auth.uid(), 'artist'::app_role)
  )
);

-- Restrict UPDATE on artwork/previews/audio-previews to admin/editor/artist
CREATE POLICY "Public buckets update by non-viewer"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = ANY (ARRAY['artwork'::text, 'previews'::text, 'audio-previews'::text])
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
    OR has_role(auth.uid(), 'artist'::app_role)
  )
)
WITH CHECK (
  bucket_id = ANY (ARRAY['artwork'::text, 'previews'::text, 'audio-previews'::text])
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
    OR has_role(auth.uid(), 'artist'::app_role)
  )
);

-- Restrict DELETE on artwork/previews/audio-previews to admin/editor
CREATE POLICY "Public buckets delete by editor"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = ANY (ARRAY['artwork'::text, 'previews'::text, 'audio-previews'::text])
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role)
  )
);

-- Supersede the narrower artwork-only insert policy now covered above
DROP POLICY IF EXISTS "artwork insert by non-viewer" ON storage.objects;