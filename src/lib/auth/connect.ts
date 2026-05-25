// Profile lookup against the Catalogus Musicus auth service.
// Issues a Bearer-authenticated GET to `${VITE_AUTH_API_URL}/auth/me`.

const AUTH_API_URL = ((import.meta.env.VITE_AUTH_API_URL as string | undefined) ?? "")
  .trim()
  .replace(/\/+$/, "");

export const AUTH_API_BASE = AUTH_API_URL;
export const authApiConfigured = Boolean(AUTH_API_URL);

export type ConnectMe = {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
  roles?: string[];
  [k: string]: unknown;
};

export async function fetchMe(accessToken: string, signal?: AbortSignal): Promise<ConnectMe | null> {
  if (!AUTH_API_URL) return null;
  const res = await fetch(`${AUTH_API_URL}/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.warn("[auth] /auth/me failed", res.status);
    return null;
  }
  return (await res.json()) as ConnectMe;
}
