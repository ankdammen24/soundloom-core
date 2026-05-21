// Back-compat shim — delegates to the central api client in @/lib/api.
import { api } from "@/lib/api";
import type { Artist, Release, Track, SearchResult, ApiHealth, PlaybackTokenResponse } from "./types";

export const apiClient = {
  getHealth: () => api.health() as Promise<ApiHealth>,
  getReleases: () => api.listReleases() as Promise<Release[]>,
  getArtists: () => api.listArtists() as Promise<Artist[]>,
  getTracks: () => api.listTracks() as Promise<Track[]>,
  searchCatalog: async (_query: string): Promise<SearchResult> => ({ artists: [], releases: [], tracks: [] }),
  requestPlaybackToken: async (_trackId: string): Promise<PlaybackTokenResponse> => ({ playbackUrl: "" }),
};
