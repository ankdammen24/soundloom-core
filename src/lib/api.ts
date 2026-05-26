const env = import.meta.env as Record<string, string | undefined>;
export const API_BASE_URL = (env.VITE_API_BASE_URL ?? "https://api.mediarosenqvist.com").replace(/\/+$/, "");

export async function apiFetch<T = unknown>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const message =
      parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as { message?: unknown }).message ?? `Request failed (${res.status})`)
        : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return parsed as T;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    for (const key of ["data", "items", "results", "tracks", "artists", "releases"]) {
      if (Array.isArray(v[key])) return v[key] as T[];
    }
    // paginated: { data: { items: [...] } }
    if (v.data && typeof v.data === "object") {
      const d = v.data as Record<string, unknown>;
      for (const key of ["items", "results"]) {
        if (Array.isArray(d[key])) return d[key] as T[];
      }
    }
  }
  return [];
}

export type CatalogTrack = {
  id: string;
  title?: string | null;
  status?: string | null;
  artist_name?: string | null;
  release_title?: string | null;
  [key: string]: unknown;
};

export const getHealth = () => apiFetch("/health");
export const getTracks = async () => asArray<CatalogTrack>(await apiFetch("/api/v1/music/tracks"));
export const getTrackById = (id: string) => apiFetch<CatalogTrack>(`/api/v1/music/tracks/${id}`);
export const getArtists = async () => asArray(await apiFetch("/api/v1/music/artists"));
export const getReleases = async () => asArray(await apiFetch("/api/v1/music/releases"));
