export type ApiHealth = { status: string; service?: string; timestamp?: string };
export type Artist = { id: string; name?: string; displayName?: string; country?: string; imageUrl?: string };
export type Release = { id: string; title: string; artistId?: string; coverUrl?: string; releaseDate?: string; type?: string };
export type Track = { id: string; title: string; artistId?: string; releaseId?: string; durationSec?: number };
export type SearchResult = { artists: Artist[]; releases: Release[]; tracks: Track[] };
export type PlaybackTokenResponse = { playbackUrl: string; expiresAt?: string };
