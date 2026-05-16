import { endpoints } from "./endpoints";
import type { ApiHealth, Artist, PlaybackTokenResponse, Release, SearchResult, Track } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}
export const apiClient = {
  getHealth: () => request<ApiHealth>(endpoints.health),
  getReleases: () => request<Release[]>(endpoints.releases),
  getArtists: () => request<Artist[]>(endpoints.artists),
  getTracks: () => request<Track[]>(endpoints.tracks),
  searchCatalog: (query: string) => request<SearchResult>(`${endpoints.search}?q=${encodeURIComponent(query)}`),
  requestPlaybackToken: (trackId: string) => request<PlaybackTokenResponse>(endpoints.playbackToken, { method: "POST", body: JSON.stringify({ trackId }) }),
};
