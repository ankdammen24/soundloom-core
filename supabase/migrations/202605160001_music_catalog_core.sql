create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_name text,
  bio text,
  country text,
  website_url text,
  image_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artists(id),
  title text not null,
  release_date date,
  artwork_key text,
  upc text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artists(id),
  album_id uuid references public.albums(id),
  title text not null,
  version text,
  isrc text,
  duration integer,
  bpm integer,
  genre text,
  mood text,
  explicit boolean not null default false,
  language text,
  status text not null default 'draft',
  rights_status text not null default 'unknown',
  master_file_key text,
  normalized_file_key text,
  preview_file_key text,
  artwork_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid references public.artists(id),
  album_id uuid references public.albums(id),
  release_type text,
  release_date date,
  upc text,
  status text not null default 'draft',
  distribution_status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  usage_type text,
  station_scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid references public.playlists(id) on delete cascade,
  track_id uuid references public.tracks(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rights (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references public.tracks(id) on delete cascade,
  composer text,
  lyricist text,
  publisher text,
  label text,
  ownership_notes text,
  stim_registered boolean not null default false,
  sami_registered boolean not null default false,
  iswc text,
  isrc text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references public.tracks(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  email text unique,
  role text,
  artist_id uuid references public.artists(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists albums_artist_id_idx on public.albums(artist_id);
create index if not exists tracks_artist_id_idx on public.tracks(artist_id);
create index if not exists tracks_album_id_idx on public.tracks(album_id);
create index if not exists tracks_status_idx on public.tracks(status);
create index if not exists releases_status_idx on public.releases(status);
create index if not exists tracks_isrc_idx on public.tracks(isrc);
create index if not exists rights_isrc_idx on public.rights(isrc);
create index if not exists albums_upc_idx on public.albums(upc);
create index if not exists releases_upc_idx on public.releases(upc);

create trigger set_artists_updated_at
before update on public.artists
for each row execute function public.set_updated_at();

create trigger set_albums_updated_at
before update on public.albums
for each row execute function public.set_updated_at();

create trigger set_tracks_updated_at
before update on public.tracks
for each row execute function public.set_updated_at();

create trigger set_releases_updated_at
before update on public.releases
for each row execute function public.set_updated_at();

create trigger set_playlists_updated_at
before update on public.playlists
for each row execute function public.set_updated_at();

create trigger set_playlist_tracks_updated_at
before update on public.playlist_tracks
for each row execute function public.set_updated_at();

create trigger set_rights_updated_at
before update on public.rights
for each row execute function public.set_updated_at();

create trigger set_processing_jobs_updated_at
before update on public.processing_jobs
for each row execute function public.set_updated_at();

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

alter table public.artists enable row level security;
alter table public.albums enable row level security;
alter table public.tracks enable row level security;
alter table public.releases enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.rights enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.users enable row level security;

create policy "service_role_all_artists" on public.artists
for all to service_role
using (true)
with check (true);

create policy "service_role_all_albums" on public.albums
for all to service_role
using (true)
with check (true);

create policy "service_role_all_tracks" on public.tracks
for all to service_role
using (true)
with check (true);

create policy "service_role_all_releases" on public.releases
for all to service_role
using (true)
with check (true);

create policy "service_role_all_playlists" on public.playlists
for all to service_role
using (true)
with check (true);

create policy "service_role_all_playlist_tracks" on public.playlist_tracks
for all to service_role
using (true)
with check (true);

create policy "service_role_all_rights" on public.rights
for all to service_role
using (true)
with check (true);

create policy "service_role_all_processing_jobs" on public.processing_jobs
for all to service_role
using (true)
with check (true);

create policy "service_role_all_users" on public.users
for all to service_role
using (true)
with check (true);
