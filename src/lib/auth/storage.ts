// Tiny localStorage wrapper for auth tokens.
// Falls back to in-memory storage when localStorage is unavailable (SSR / privacy mode).

const ACCESS_KEY = "cm.auth.accessToken";
const REFRESH_KEY = "cm.auth.refreshToken";

const memory = new Map<string, string>();

function get(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
  } catch {
    /* ignore */
  }
  return memory.get(key) ?? null;
}

function set(key: string, value: string | null) {
  try {
    if (typeof localStorage !== "undefined") {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      return;
    }
  } catch {
    /* ignore */
  }
  if (value === null) memory.delete(key);
  else memory.set(key, value);
}

export const tokenStorage = {
  getAccess: () => get(ACCESS_KEY),
  getRefresh: () => get(REFRESH_KEY),
  setAccess: (v: string | null) => set(ACCESS_KEY, v),
  setRefresh: (v: string | null) => set(REFRESH_KEY, v),
  clear: () => {
    set(ACCESS_KEY, null);
    set(REFRESH_KEY, null);
  },
};
