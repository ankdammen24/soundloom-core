// Database types — mirror the Supabase schema in supabase-schema.sql.
// Once your Supabase project is connected, regenerate with:
//   supabase gen types typescript --project-id <id> > src/lib/database.types.ts
// and switch imports there. Until then this hand-written shape is the contract.

export type TrackStatus =
  | "draft"
  | "uploaded"
  | "processing"
  | "needs_metadata"
  | "needs_rights_check"
  | "approved"
  | "published"
  | "distributed"
  | "archived";
export type RightsStatus = "unknown" | "incomplete" | "cleared" | "blocked";
export type AlbumStatus = "draft" | "scheduled" | "released" | "archived";
export type ReleaseStatus = "draft" | "scheduled" | "live" | "takedown";
export type DistributionStatus = "pending" | "in_progress" | "delivered" | "failed";
export type JobStatus = "queued" | "running" | "success" | "failed";
export type ReleaseType = "single" | "ep" | "album" | "compilation";
export type PlaylistUsage = "radio" | "on_demand" | "editorial" | "internal";
export type StationScope = "radio_core" | "music_core" | "radio_uppsala" | "all";

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: Artist;
        Insert: Partial<Artist> & { name: string; display_name: string };
        Update: Partial<Artist>;
      };
      albums: {
        Row: Album;
        Insert: Partial<Album> & { artist_id: string; title: string };
        Update: Partial<Album>;
      };
      tracks: {
        Row: Track;
        Insert: Partial<Track> & { artist_id: string; title: string };
        Update: Partial<Track>;
      };
      releases: {
        Row: Release;
        Insert: Partial<Release> & { title: string; artist_id: string };
        Update: Partial<Release>;
      };
      playlists: {
        Row: Playlist;
        Insert: Partial<Playlist> & { name: string };
        Update: Partial<Playlist>;
      };
      playlist_tracks: {
        Row: PlaylistTrack;
        Insert: Partial<PlaylistTrack> & { playlist_id: string; track_id: string };
        Update: Partial<PlaylistTrack>;
      };
      rights: {
        Row: Rights;
        Insert: Partial<Rights> & { track_id: string };
        Update: Partial<Rights>;
      };
      processing_jobs: {
        Row: ProcessingJob;
        Insert: Partial<ProcessingJob> & { track_id: string; job_type: string };
        Update: Partial<ProcessingJob>;
      };
    };
  };
}

export interface Artist {
  id: string;
  name: string;
  display_name: string;
  bio: string;
  country: string;
  website_url: string;
  image_key: string | null;
  created_at: string;
}

export interface Album {
  id: string;
  artist_id: string;
  title: string;
  release_date: string | null;
  artwork_key: string | null;
  upc: string;
  status: AlbumStatus;
  created_at: string;
}

export interface Track {
  id: string;
  artist_id: string;
  album_id: string | null;
  title: string;
  version: string;
  isrc: string;
  duration: number;
  bpm: number;
  genre: string;
  mood: string;
  explicit: boolean;
  language: string;
  status: TrackStatus;
  rights_status: RightsStatus;
  master_file_key: string | null;
  normalized_file_key: string | null;
  preview_file_key: string | null;
  artwork_key: string | null;
  created_at: string;
}

export interface Release {
  id: string;
  title: string;
  artist_id: string;
  album_id: string | null;
  release_type: ReleaseType;
  release_date: string | null;
  upc: string;
  status: ReleaseStatus;
  distribution_status: DistributionStatus;
  created_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  usage_type: PlaylistUsage;
  station_scope: StationScope;
  created_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  sort_order: number;
}

export interface Rights {
  id: string;
  track_id: string;
  composer: string;
  lyricist: string;
  publisher: string;
  label: string;
  ownership_notes: string;
  stim_registered: boolean;
  sami_registered: boolean;
  iswc: string;
  isrc: string;
  created_at: string;
}

export interface ProcessingJob {
  id: string;
  track_id: string;
  job_type: string;
  status: JobStatus;
  message: string;
  created_at: string;
  completed_at: string | null;
}
