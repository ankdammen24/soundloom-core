
-- Enums
DO $$ BEGIN
  CREATE TYPE public.upload_status AS ENUM (
    'uploaded','queued','processing','analyzed','needs_review','approved','rejected','failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.release_type AS ENUM ('single','ep','album');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.job_status AS ENUM ('queued','running','succeeded','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.review_decision AS ENUM ('approve','reject','changes');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ artists ============
CREATE TABLE IF NOT EXISTS public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  image_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS artists_touch ON public.artists;
CREATE TRIGGER artists_touch BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Artists: read for authenticated" ON public.artists
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Artists: editors manage" ON public.artists
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Artists: artists manage own" ON public.artists
  FOR ALL TO authenticated
  USING (created_by = auth.uid() AND public.has_role(auth.uid(),'artist'))
  WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(),'artist'));

-- ============ releases ============
CREATE TABLE IF NOT EXISTS public.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  release_date date,
  artwork_url text,
  upc text,
  type public.release_type NOT NULL DEFAULT 'single',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, slug)
);
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS releases_touch ON public.releases;
CREATE TRIGGER releases_touch BEFORE UPDATE ON public.releases
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS releases_artist_idx ON public.releases(artist_id);

CREATE POLICY "Releases: read for authenticated" ON public.releases
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Releases: editors manage" ON public.releases
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Releases: artists manage own" ON public.releases
  FOR ALL TO authenticated
  USING (created_by = auth.uid() AND public.has_role(auth.uid(),'artist'))
  WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(),'artist'));

-- ============ audio_files ============
CREATE TABLE IF NOT EXISTS public.audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid,
  storage_bucket text NOT NULL DEFAULT 'audio-uploads',
  storage_path text NOT NULL,
  mime text,
  size_bytes bigint,
  duration_seconds numeric,
  codec text,
  sample_rate integer,
  bit_depth integer,
  channels integer,
  loudness_lufs numeric,
  true_peak_dbtp numeric,
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  processing_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  checksum text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AudioFiles: editors read" ON public.audio_files
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- ============ tracks ============
CREATE TABLE IF NOT EXISTS public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES public.releases(id) ON DELETE SET NULL,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title text NOT NULL,
  track_number integer,
  isrc text,
  genre text,
  duration_seconds numeric,
  primary_audio_file_id uuid REFERENCES public.audio_files(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS tracks_touch ON public.tracks;
CREATE TRIGGER tracks_touch BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS tracks_release_idx ON public.tracks(release_id);
CREATE INDEX IF NOT EXISTS tracks_artist_idx ON public.tracks(artist_id);

CREATE POLICY "Tracks: read for authenticated" ON public.tracks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tracks: editors manage" ON public.tracks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Tracks: artists manage own" ON public.tracks
  FOR ALL TO authenticated
  USING (created_by = auth.uid() AND public.has_role(auth.uid(),'artist'))
  WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(),'artist'));

-- ============ uploads ============
CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  release_id uuid REFERENCES public.releases(id) ON DELETE SET NULL,
  track_title text NOT NULL,
  genre text,
  isrc text,
  notes text,
  artwork_path text,
  status public.upload_status NOT NULL DEFAULT 'uploaded',
  rejection_reason text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS uploads_touch ON public.uploads;
CREATE TRIGGER uploads_touch BEFORE UPDATE ON public.uploads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS uploads_status_idx ON public.uploads(status);
CREATE INDEX IF NOT EXISTS uploads_created_by_idx ON public.uploads(created_by);

CREATE POLICY "Uploads: editors read all" ON public.uploads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Uploads: owner read own" ON public.uploads
  FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Uploads: insert by non-viewer" ON public.uploads
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'editor')
      OR public.has_role(auth.uid(),'artist')
    )
  );
CREATE POLICY "Uploads: editors update" ON public.uploads
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- Add FK from audio_files.upload_id to uploads (after uploads exists)
DO $$ BEGIN
  ALTER TABLE public.audio_files
    ADD CONSTRAINT audio_files_upload_fk
    FOREIGN KEY (upload_id) REFERENCES public.uploads(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS audio_files_upload_idx ON public.audio_files(upload_id);

-- ============ processing_jobs ============
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
  status public.job_status NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS processing_jobs_touch ON public.processing_jobs;
CREATE TRIGGER processing_jobs_touch BEFORE UPDATE ON public.processing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS processing_jobs_upload_idx ON public.processing_jobs(upload_id);

CREATE POLICY "Jobs: editors read" ON public.processing_jobs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- ============ review_items ============
CREATE TABLE IF NOT EXISTS public.review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decision public.review_decision,
  reason text,
  decided_at timestamptz,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS review_items_touch ON public.review_items;
CREATE TRIGGER review_items_touch BEFORE UPDATE ON public.review_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Review: editors read" ON public.review_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- ============ api_keys ============
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  prefix text NOT NULL,
  key_hash text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ApiKeys: admin all" ON public.api_keys
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ audit_logs ============
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit: editors read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- ============ Storage buckets ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-uploads','audio-uploads', false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-previews','audio-previews', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "audio-uploads owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audio-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "audio-uploads owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'audio-uploads'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'editor')
    )
  );
CREATE POLICY "audio-uploads owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'audio-uploads'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(),'admin')
    )
  );

CREATE POLICY "artwork insert by non-viewer" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'artwork'
    AND (
      public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'editor')
      OR public.has_role(auth.uid(),'artist')
    )
  );
