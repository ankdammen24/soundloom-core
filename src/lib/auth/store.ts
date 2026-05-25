// Minimal reactive auth store, no extra dependencies.
// Uses useSyncExternalStore so React components re-render on auth changes.

import { useSyncExternalStore } from "react";

export type AuthUser = {
  id: string;
  email?: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string;
  [k: string]: unknown;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type State = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
};

let state: State = {
  status: "loading",
  user: null,
  accessToken: null,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const authStore = {
  getState: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  set: (patch: Partial<State>) => {
    state = { ...state, ...patch };
    emit();
  },
  signOut: () => {
    state = { status: "unauthenticated", user: null, accessToken: null };
    emit();
  },
};

export function useAuthState(): State {
  return useSyncExternalStore(
    (l) => authStore.subscribe(l),
    () => authStore.getState(),
    () => authStore.getState(),
  );
}
