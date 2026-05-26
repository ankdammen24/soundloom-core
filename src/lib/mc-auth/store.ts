// Reactive store for media-catalog backend auth (separate from Supabase auth).

import { useSyncExternalStore } from "react";

export type McUser = {
  id: string;
  email?: string;
  name?: string;
  displayName?: string;
  roles: string[];
  [key: string]: unknown;
};

export type McAuthStatus = "loading" | "authenticated" | "unauthenticated";

type State = {
  status: McAuthStatus;
  user: McUser | null;
  accessToken: string | null;
  /** Epoch ms when the current access token expires (best-effort). */
  expiresAt: number | null;
};

let state: State = {
  status: "loading",
  user: null,
  accessToken: null,
  expiresAt: null,
};

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

export const mcAuthStore = {
  getState: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** Read the current access token without subscribing. */
  getAccessToken: () => state.accessToken,
  setLoading: () => {
    state = { ...state, status: "loading" };
    emit();
  },
  setAuthenticated: (user: McUser, accessToken: string, expiresAt: number | null) => {
    state = { status: "authenticated", user, accessToken, expiresAt };
    emit();
  },
  setUnauthenticated: () => {
    state = { status: "unauthenticated", user: null, accessToken: null, expiresAt: null };
    emit();
  },
  updateToken: (accessToken: string, expiresAt: number | null) => {
    state = { ...state, accessToken, expiresAt };
    emit();
  },
};

export function useMcAuthState(): State {
  return useSyncExternalStore(
    (l) => mcAuthStore.subscribe(l),
    () => mcAuthStore.getState(),
    () => mcAuthStore.getState(),
  );
}
