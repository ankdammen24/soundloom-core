
DROP POLICY IF EXISTS "Public buckets insert by non-viewer" ON storage.objects;

CREATE POLICY "Public buckets insert by editor"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = ANY (ARRAY['artwork'::text, 'previews'::text, 'audio-previews'::text])
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Public buckets insert own by artist"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = ANY (ARRAY['artwork'::text, 'previews'::text, 'audio-previews'::text])
  AND has_role(auth.uid(), 'artist'::app_role)
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
