// Minimal reactive auth store backed by Connect session.

import { useSyncExternalStore } from "react";
import type { ConnectClaims, ConnectUser } from "@/lib/connectAuth";

export type AuthUser = {
  id: string;
  email?: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  claims: ConnectClaims;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type State = {
  status: AuthStatus;
  user: AuthUser | null;
};

let state: State = { status: "loading", user: null };

const listeners = new Set<() => void>();
function emit() { for (const l of listeners) l(); }

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
  setFromUser: (user: ConnectUser | null) => {
    if (!user) {
      state = { status: "unauthenticated", user: null };
    } else {
      state = {
        status: "authenticated",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          displayName: user.displayName,
          roles: user.roles,
          permissions: user.permissions,
          claims: user.claims,
        },
      };
    }
    emit();
  },
  signOut: () => {
    state = { status: "unauthenticated", user: null };
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
