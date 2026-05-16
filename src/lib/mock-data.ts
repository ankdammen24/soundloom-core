import type {
  Album, Artist, Playlist, PlaylistTrack, ProcessingJob, Release, Rights, Track,
} from "./types";

const iso = (d: string) => new Date(d).toISOString();

export const artists: Artist[] = [
  { id: "a1", name: "Sigrid Hammar", display_name: "Sigrid Hammar", bio: "Stockholm indie-folk songwriter.", country: "SE", website_url: "https://example.com", image_key: null, created_at: iso("2024-08-12") },
  { id: "a2", name: "Norrsken", display_name: "Norrsken", bio: "Ambient electronic duo from Umeå.", country: "SE", website_url: "https://example.com", image_key: null, created_at: iso("2024-10-03") },
  { id: "a3", name: "Klara Vinge", display_name: "Klara Vinge", bio: "Singer-songwriter, Uppsala scene.", country: "SE", website_url: "", image_key: null, created_at: iso("2025-01-22") },
  { id: "a4", name: "Bråvalla Brass", display_name: "Bråvalla Brass", bio: "Modern brass collective.", country: "SE", website_url: "", image_key: null, created_at: iso("2025-03-09") },
];

export const albums: Album[] = [
  { id: "al1", artist_id: "a1", title: "Höstljus", release_date: "2024-10-18", artwork_key: null, upc: "7320470123456", status: "released", created_at: iso("2024-09-01") },
  { id: "al2", artist_id: "a2", title: "Polar Drift", release_date: "2025-02-14", artwork_key: null, upc: "7320470234567", status: "released", created_at: iso("2025-01-10") },
  { id: "al3", artist_id: "a3", title: "Stadens puls", release_date: "2025-05-30", artwork_key: null, upc: "", status: "scheduled", created_at: iso("2025-04-01") },
  { id: "al4", artist_id: "a4", title: "Mässingsljud Vol. 1", release_date: "", artwork_key: null, upc: "", status: "draft", created_at: iso("2025-05-12") },
];

export const tracks: Track[] = [
  { id: "t1", artist_id: "a1", album_id: "al1", title: "Höstljus", version: "Original", isrc: "SE-ABC-24-00001", duration: 214, bpm: 92, genre: "Indie Folk", mood: "Reflective", explicit: false, language: "sv", status: "published", rights_status: "cleared", master_file_key: "masters/t1.wav", normalized_file_key: "norm/t1.flac", preview_file_key: "previews/t1.mp3", artwork_key: null, created_at: iso("2024-09-15") },
  { id: "t2", artist_id: "a1", album_id: "al1", title: "Vinterväg", version: "Original", isrc: "SE-ABC-24-00002", duration: 198, bpm: 84, genre: "Indie Folk", mood: "Melancholic", explicit: false, language: "sv", status: "distributed", rights_status: "cleared", master_file_key: "masters/t2.wav", normalized_file_key: "norm/t2.flac", preview_file_key: "previews/t2.mp3", artwork_key: null, created_at: iso("2024-09-16") },
  { id: "t3", artist_id: "a2", album_id: "al2", title: "Aurora I", version: "Extended", isrc: "SE-ABC-25-00010", duration: 412, bpm: 110, genre: "Ambient", mood: "Atmospheric", explicit: false, language: "instrumental", status: "approved", rights_status: "cleared", master_file_key: "masters/t3.wav", normalized_file_key: null, preview_file_key: null, artwork_key: null, created_at: iso("2025-01-20") },
  { id: "t4", artist_id: "a2", album_id: "al2", title: "Aurora II", version: "Radio Edit", isrc: "SE-ABC-25-00011", duration: 198, bpm: 112, genre: "Ambient", mood: "Atmospheric", explicit: false, language: "instrumental", status: "needs_metadata", rights_status: "incomplete", master_file_key: "masters/t4.wav", normalized_file_key: null, preview_file_key: null, artwork_key: null, created_at: iso("2025-01-21") },
  { id: "t5", artist_id: "a3", album_id: "al3", title: "Stadens puls", version: "Original", isrc: "", duration: 226, bpm: 120, genre: "Pop", mood: "Energetic", explicit: false, language: "sv", status: "processing", rights_status: "unknown", master_file_key: "masters/t5.wav", normalized_file_key: null, preview_file_key: null, artwork_key: null, created_at: iso("2025-04-10") },
  { id: "t6", artist_id: "a3", album_id: "al3", title: "Natt över Fyris", version: "Original", isrc: "", duration: 245, bpm: 96, genre: "Pop", mood: "Nostalgic", explicit: false, language: "sv", status: "needs_rights_check", rights_status: "incomplete", master_file_key: "masters/t6.wav", normalized_file_key: null, preview_file_key: null, artwork_key: null, created_at: iso("2025-04-11") },
  { id: "t7", artist_id: "a4", album_id: "al4", title: "Fanfar i C", version: "Live", isrc: "", duration: 178, bpm: 132, genre: "Brass", mood: "Triumphant", explicit: false, language: "instrumental", status: "uploaded", rights_status: "unknown", master_file_key: "masters/t7.wav", normalized_file_key: null, preview_file_key: null, artwork_key: null, created_at: iso("2025-05-15") },
  { id: "t8", artist_id: "a4", album_id: null, title: "Marsch nr 3", version: "Demo", isrc: "", duration: 142, bpm: 120, genre: "Brass", mood: "Stately", explicit: false, language: "instrumental", status: "draft", rights_status: "unknown", master_file_key: null, normalized_file_key: null, preview_file_key: null, artwork_key: null, created_at: iso("2025-05-16") },
];

export const releases: Release[] = [
  { id: "r1", title: "Höstljus", artist_id: "a1", album_id: "al1", release_type: "album", release_date: "2024-10-18", upc: "7320470123456", status: "live", distribution_status: "delivered", created_at: iso("2024-09-30") },
  { id: "r2", title: "Polar Drift", artist_id: "a2", album_id: "al2", release_type: "ep", release_date: "2025-02-14", upc: "7320470234567", status: "live", distribution_status: "delivered", created_at: iso("2025-01-30") },
  { id: "r3", title: "Stadens puls (Single)", artist_id: "a3", album_id: "al3", release_type: "single", release_date: "2025-05-30", upc: "", status: "scheduled", distribution_status: "pending", created_at: iso("2025-04-20") },
];

export const playlists: Playlist[] = [
  { id: "p1", name: "Radio Core – Morning Rotation", description: "Weekday morning A-list rotation.", usage_type: "radio", station_scope: "radio_core", created_at: iso("2025-01-05") },
  { id: "p2", name: "Music Core – Editorial: New Swedish", description: "Curated new releases.", usage_type: "editorial", station_scope: "music_core", created_at: iso("2025-02-10") },
  { id: "p3", name: "Radio Uppsala – Late Night", description: "Mellow late-night programming.", usage_type: "radio", station_scope: "radio_uppsala", created_at: iso("2025-03-22") },
];

export const playlistTracks: PlaylistTrack[] = [
  { id: "pt1", playlist_id: "p1", track_id: "t1", sort_order: 1 },
  { id: "pt2", playlist_id: "p1", track_id: "t2", sort_order: 2 },
  { id: "pt3", playlist_id: "p2", track_id: "t3", sort_order: 1 },
  { id: "pt4", playlist_id: "p3", track_id: "t1", sort_order: 1 },
  { id: "pt5", playlist_id: "p3", track_id: "t6", sort_order: 2 },
];

export const rights: Rights[] = [
  { id: "rt1", track_id: "t1", composer: "Sigrid Hammar", lyricist: "Sigrid Hammar", publisher: "Hammar Music AB", label: "Rosenqvist Records", ownership_notes: "100% controlled.", stim_registered: true, sami_registered: true, iswc: "T-123.456.789-0", isrc: "SE-ABC-24-00001", created_at: iso("2024-09-20") },
  { id: "rt2", track_id: "t2", composer: "Sigrid Hammar", lyricist: "Sigrid Hammar", publisher: "Hammar Music AB", label: "Rosenqvist Records", ownership_notes: "100% controlled.", stim_registered: true, sami_registered: true, iswc: "T-123.456.790-0", isrc: "SE-ABC-24-00002", created_at: iso("2024-09-20") },
  { id: "rt3", track_id: "t3", composer: "Norrsken", lyricist: "", publisher: "Norrsken Publishing", label: "Rosenqvist Records", ownership_notes: "Co-write 50/50 with J. Lindqvist.", stim_registered: true, sami_registered: false, iswc: "", isrc: "SE-ABC-25-00010", created_at: iso("2025-01-25") },
  { id: "rt4", track_id: "t4", composer: "Norrsken", lyricist: "", publisher: "", label: "Rosenqvist Records", ownership_notes: "Publisher TBD.", stim_registered: false, sami_registered: false, iswc: "", isrc: "SE-ABC-25-00011", created_at: iso("2025-01-25") },
];

export const processingJobs: ProcessingJob[] = [
  { id: "j1", track_id: "t5", job_type: "normalize", status: "running", message: "Loudness analysis 62%", created_at: iso("2025-05-16T08:14:00Z"), completed_at: null },
  { id: "j2", track_id: "t5", job_type: "preview", status: "queued", message: "Awaiting normalize", created_at: iso("2025-05-16T08:14:01Z"), completed_at: null },
  { id: "j3", track_id: "t7", job_type: "transcode", status: "success", message: "Transcoded to FLAC + MP3", created_at: iso("2025-05-15T18:02:00Z"), completed_at: iso("2025-05-15T18:04:12Z") },
  { id: "j4", track_id: "t4", job_type: "fingerprint", status: "failed", message: "Master file missing tags", created_at: iso("2025-05-14T11:00:00Z"), completed_at: iso("2025-05-14T11:00:08Z") },
  { id: "j5", track_id: "t1", job_type: "distribute", status: "success", message: "Delivered to 142 DSPs", created_at: iso("2024-10-18T06:00:00Z"), completed_at: iso("2024-10-18T06:11:00Z") },
];

export const findArtist = (id: string) => artists.find((a) => a.id === id);
export const findAlbum = (id: string | null) => (id ? albums.find((a) => a.id === id) : undefined);
export const findTrack = (id: string) => tracks.find((t) => t.id === id);
