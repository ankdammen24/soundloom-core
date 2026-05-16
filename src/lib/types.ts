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
  release_date: string;
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
  duration: number; // seconds
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
  release_type: "single" | "ep" | "album" | "compilation";
  release_date: string;
  upc: string;
  status: ReleaseStatus;
  distribution_status: DistributionStatus;
  created_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  usage_type: "radio" | "on_demand" | "editorial" | "internal";
  station_scope: "radio_core" | "music_core" | "radio_uppsala" | "all";
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
  job_type: "normalize" | "preview" | "transcode" | "fingerprint" | "distribute";
  status: JobStatus;
  message: string;
  created_at: string;
  completed_at: string | null;
}
