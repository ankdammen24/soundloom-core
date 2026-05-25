// Minimal reactive auth store, no extra dependencies.
// Mirrors the MSAL active account into a React-subscribable state.

import { useSyncExternalStore } from "react";
import type { AccountInfo } from "@azure/msal-browser";

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
  account: AccountInfo | null;
};

let state: State = {
  status: "loading",
  user: null,
  account: null,
};

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
  setFromAccount: (account: AccountInfo | null) => {
    if (!account) {
      state = { status: "unauthenticated", user: null, account: null };
    } else {
      state = {
        status: "authenticated",
        account,
        user: {
          id: account.localAccountId ?? account.homeAccountId ?? account.username,
          email: account.username,
          name: account.name ?? account.username,
          displayName: account.name ?? account.username,
        },
      };
    }
    emit();
  },
  signOut: () => {
    state = { status: "unauthenticated", user: null, account: null };
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
