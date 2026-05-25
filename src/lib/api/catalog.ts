// Typed wrappers around the media-catalog catalog endpoints.

import { api } from "./client";

export type Artist = {
  id: string;
  name: string;
  slug?: string | null;
  bio?: string | null;
  image_url?: string | null;
  created_at?: string;
};

export type Release = {
  id: string;
  title: string;
  slug?: string | null;
  type: "single" | "ep" | "album" | string;
  artist_id: string;
  release_date?: string | null;
  upc?: string | null;
  created_at?: string;
};

export type Track = {
  id: string;
  title: string;
  artist_id: string;
  release_id?: string | null;
  isrc?: string | null;
  genre?: string | null;
  duration_seconds?: number | null;
  created_at?: string;
};

// Some APIs wrap collections in { data: [...] }; tolerate both shapes.
function asArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object" && Array.isArray((v as { data?: unknown }).data)) {
    return (v as { data: T[] }).data;
  }
  return [];
}

export const artistsApi = {
  list: async (): Promise<Artist[]> => asArray<Artist>(await api.get("/api/v1/music/artists")),
  create: (input: { name: string; bio?: string | null; image_url?: string | null }) =>
    api.post<Artist>("/api/v1/music/artists", input),
};

export const releasesApi = {
  list: async (): Promise<Release[]> => asArray<Release>(await api.get("/api/v1/music/releases")),
  create: (input: {
    title: string;
    artist_id: string;
    type: Release["type"];
    release_date?: string | null;
    upc?: string | null;
  }) => api.post<Release>("/api/v1/music/releases", input),
};

export const tracksApi = {
  list: async (): Promise<Track[]> => asArray<Track>(await api.get("/api/v1/music/tracks")),
  create: (input: {
    title: string;
    artist_id: string;
    release_id?: string | null;
    isrc?: string | null;
    genre?: string | null;
    duration_seconds?: number | null;
  }) => api.post<Track>("/api/v1/music/tracks", input),
};
