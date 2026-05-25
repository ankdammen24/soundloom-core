// Permission helpers backed by JWT claims from Connect.
// Frontend gating is UX only — backend remains the real authority.

import { useAuthState } from "./store";

export const PERMISSIONS = {
  CATALOG_READ: "catalog.read",
  ARTISTS_MANAGE: "artists.manage",
  RELEASES_MANAGE: "releases.manage",
  TRACKS_UPLOAD: "tracks.upload",
  TRACKS_PROCESS: "tracks.process",
  METADATA_EDIT: "metadata.edit",
  USERS_MANAGE: "users.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function useHasPermission(p: string): boolean {
  const { user } = useAuthState();
  if (!user) return false;
  return user.permissions.includes(p);
}

export function useHasAnyPermission(ps: string[]): boolean {
  const { user } = useAuthState();
  if (!user) return false;
  return ps.some((p) => user.permissions.includes(p));
}

export function useHasAllPermissions(ps: string[]): boolean {
  const { user } = useAuthState();
  if (!user) return false;
  return ps.every((p) => user.permissions.includes(p));
}

export function useHasRole(role: string): boolean {
  const { user } = useAuthState();
  if (!user) return false;
  return user.roles.includes(role);
}
