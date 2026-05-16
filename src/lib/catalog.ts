import { useQuery } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "./supabase";
import type {
  Artist, Album, Track, Release, Playlist, PlaylistTrack, Rights, ProcessingJob,
} from "./types";

const enabled = supabaseConfigured;

function table<T>(name: string, order: { column: string; ascending: boolean } = { column: "created_at", ascending: false }) {
  return async (): Promise<T[]> => {
    const { data, error } = await supabase
      .from(name)
      .select("*")
      .order(order.column, { ascending: order.ascending });
    if (error) throw error;
    return (data ?? []) as T[];
  };
}

export const queryKeys = {
  artists: ["catalog", "artists"] as const,
  albums: ["catalog", "albums"] as const,
  tracks: ["catalog", "tracks"] as const,
  releases: ["catalog", "releases"] as const,
  playlists: ["catalog", "playlists"] as const,
  playlistTracks: ["catalog", "playlist_tracks"] as const,
  rights: ["catalog", "rights"] as const,
  processingJobs: ["catalog", "processing_jobs"] as const,
};

export const useArtists = () =>
  useQuery({ queryKey: queryKeys.artists, queryFn: table<Artist>("artists"), enabled });
export const useAlbums = () =>
  useQuery({ queryKey: queryKeys.albums, queryFn: table<Album>("albums"), enabled });
export const useTracks = () =>
  useQuery({ queryKey: queryKeys.tracks, queryFn: table<Track>("tracks"), enabled });
export const useReleases = () =>
  useQuery({ queryKey: queryKeys.releases, queryFn: table<Release>("releases"), enabled });
export const usePlaylists = () =>
  useQuery({ queryKey: queryKeys.playlists, queryFn: table<Playlist>("playlists"), enabled });
export const usePlaylistTracks = () =>
  useQuery({
    queryKey: queryKeys.playlistTracks,
    queryFn: table<PlaylistTrack>("playlist_tracks", { column: "sort_order", ascending: true }),
    enabled,
  });
export const useRights = () =>
  useQuery({ queryKey: queryKeys.rights, queryFn: table<Rights>("rights"), enabled });
export const useProcessingJobs = () =>
  useQuery({ queryKey: queryKeys.processingJobs, queryFn: table<ProcessingJob>("processing_jobs"), enabled });

// Lookups
export function buildLookup<T extends { id: string }>(rows: T[] | undefined) {
  const map = new Map<string, T>();
  for (const r of rows ?? []) map.set(r.id, r);
  return (id: string | null | undefined) => (id ? map.get(id) : undefined);
}
