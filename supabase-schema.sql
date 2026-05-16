-- Music Catalog Core — Supabase schema
-- Central catalog source of truth. Run this in your Supabase project's SQL editor.
-- Consuming services (Radio Core, Music Core, Aggregator, Radio Uppsala) read via the catalog API.

create extension if not exists "pgcrypto";

-- ENUMS
do $$ begin
  create type track_status as enum ('draft','uploaded','processing','needs_metadata','needs_rights_check','approved','published','distributed','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rights_status as enum ('unknown','incomplete','cleared','blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type album_status as enum ('draft','scheduled','released','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type release_status as enum ('draft','scheduled','live','takedown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type distribution_status as enum ('pending','in_progress','delivered','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('queued','running','success','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type release_type as enum ('single','ep','album','compilation');
exception when duplicate_object then null; end $$;

do $$ begin
  create type playlist_usage as enum ('radio','on_demand','editorial','internal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type station_scope as enum ('radio_core','music_core','radio_uppsala','all');
exception when duplicate_object then null; end $$;

-- TABLES
create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_name text not null,
  bio text default '',
  country text default '',
  website_url text default '',
  image_key text,
  created_at timestamptz not null default now()
);

create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  title text not null,
  release_date date,
  artwork_key text,
  upc text default '',
  status album_status not null default 'draft',
  created_at timestamptz not null default now()
);
create index if not exists albums_artist_idx on albums(artist_id);

create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete restrict,
  album_id uuid references albums(id) on delete set null,
  title text not null,
  version text default 'Original',
  isrc text default '',
  duration int default 0,
  bpm int default 0,
  genre text default '',
  mood text default '',
  explicit boolean not null default false,
  language text default '',
  status track_status not null default 'draft',
  rights_status rights_status not null default 'unknown',
  master_file_key text,
  normalized_file_key text,
  preview_file_key text,
  artwork_key text,
  created_at timestamptz not null default now()
);
create index if not exists tracks_artist_idx on tracks(artist_id);
create index if not exists tracks_album_idx on tracks(album_id);
create index if not exists tracks_status_idx on tracks(status);
create index if not exists tracks_rights_idx on tracks(rights_status);

create table if not exists releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid not null references artists(id) on delete restrict,
  album_id uuid references albums(id) on delete set null,
  release_type release_type not null default 'single',
  release_date date,
  upc text default '',
  status release_status not null default 'draft',
  distribution_status distribution_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  usage_type playlist_usage not null default 'editorial',
  station_scope station_scope not null default 'all',
  created_at timestamptz not null default now()
);

create table if not exists playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references playlists(id) on delete cascade,
  track_id uuid not null references tracks(id) on delete cascade,
  sort_order int not null default 0
);
create index if not exists playlist_tracks_playlist_idx on playlist_tracks(playlist_id);

create table if not exists rights (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references tracks(id) on delete cascade,
  composer text default '',
  lyricist text default '',
  publisher text default '',
  label text default '',
  ownership_notes text default '',
  stim_registered boolean not null default false,
  sami_registered boolean not null default false,
  iswc text default '',
  isrc text default '',
  created_at timestamptz not null default now()
);
create index if not exists rights_track_idx on rights(track_id);

create table if not exists processing_jobs (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references tracks(id) on delete cascade,
  job_type text not null,
  status job_status not null default 'queued',
  message text default '',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists jobs_track_idx on processing_jobs(track_id);
create index if not exists jobs_status_idx on processing_jobs(status);

-- RLS — lock down by default. Admin app uses the service role; consuming
-- services authenticate via signed API requests.
alter table artists enable row level security;
alter table albums enable row level security;
alter table tracks enable row level security;
alter table releases enable row level security;
alter table playlists enable row level security;
alter table playlist_tracks enable row level security;
alter table rights enable row level security;
alter table processing_jobs enable row level security;
