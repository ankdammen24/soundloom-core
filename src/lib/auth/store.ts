// Reactive auth store backed by Supabase session.

import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthProvider = "google" | "github" | "azure" | "apple" | string;

export type AuthUser = {
  id: string;
  email?: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string;
  provider?: AuthProvider;
  roles: string[];
  permissions: string[];
  // Raw JWT app_metadata/user_metadata bag for debug.
  claims: Record<string, unknown>;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type State = {
  status: AuthStatus;
  user: AuthUser | null;
};

let state: State = { status: "loading", user: null };

const listeners = new Set<() => void>();
function emit() { for (const l of listeners) l(); }

function mapUser(u: User, session?: Session | null): AuthUser {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const app = (u.app_metadata ?? {}) as Record<string, unknown>;
  const provider = (app.provider as string | undefined) ?? session?.user.app_metadata?.provider;
  const roles = Array.isArray((app as { roles?: unknown }).roles)
    ? ((app as { roles: string[] }).roles)
    : [];
  return {
    id: u.id,
    email: u.email ?? (meta.email as string | undefined),
    name: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? u.email,
    displayName: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? u.email,
    avatarUrl: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined),
    provider,
    roles,
    permissions: [],
    claims: { ...meta, app_metadata: app },
  };
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
  setFromSession: (session: Session | null) => {
    if (!session?.user) {
      state = { status: "unauthenticated", user: null };
    } else {
      state = { status: "authenticated", user: mapUser(session.user, session) };
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
