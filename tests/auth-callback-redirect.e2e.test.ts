/**
 * E2E-style test for the SSO callback redirect contract.
 *
 * We can't drive a real SAML IdP from a unit test, so we simulate the
 * post-SSO state the callback sees: a freshly-authenticated user with a
 * set of roles plus the `next` query param the IdP forwarded.
 *
 * Contract under test:
 *   An admin who is sent through SSO with `next=/profile` must land on
 *   `/dashboard` (admin landing) and NOT on `/profile`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the supabase client used by fetchUserRoles so we control role lookup.
const rolesByUser = new Map<string, string[]>();

vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      from: (_table: string) => ({
        select: (_cols: string) => ({
          eq: async (_col: string, userId: string) => ({
            data: (rolesByUser.get(userId) ?? []).map((role) => ({ role })),
            error: null,
          }),
        }),
      }),
    },
  };
});

import {
  callbackLanding,
  fetchUserRoles,
  landingForRoles,
  safeInternalTarget,
} from "@/lib/auth/landing";

const ADMIN_USER = "d29faa36-b996-46ba-8a55-55646113d291";
const EDITOR_USER = "11111111-1111-1111-1111-111111111111";
const PLAIN_USER = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  rolesByUser.clear();
  rolesByUser.set(ADMIN_USER, ["admin"]);
  rolesByUser.set(EDITOR_USER, ["editor"]);
  rolesByUser.set(PLAIN_USER, []);
});

describe("SSO callback redirect — admin with next=/profile", () => {
  it("redirects admin to /dashboard even when next=/profile is forwarded", async () => {
    const roles = await fetchUserRoles(ADMIN_USER);
    expect(roles).toContain("admin");

    const target = callbackLanding("/profile", roles);
    expect(target).toBe("/dashboard");
  });

  it("redirects admin to /dashboard when no next is provided", async () => {
    const roles = await fetchUserRoles(ADMIN_USER);
    expect(callbackLanding("", roles)).toBe("/dashboard");
    expect(callbackLanding(null, roles)).toBe("/dashboard");
    expect(callbackLanding(undefined, roles)).toBe("/dashboard");
  });

  it("honours a non-/profile next for admin (e.g. deep link to /admin/users)", async () => {
    const roles = await fetchUserRoles(ADMIN_USER);
    expect(callbackLanding("/admin/users", roles)).toBe("/admin/users");
  });

  it("rejects unsafe next values and falls back to role landing", async () => {
    const roles = await fetchUserRoles(ADMIN_USER);
    expect(callbackLanding("//evil.com", roles)).toBe("/dashboard");
    expect(callbackLanding("https://evil.com", roles)).toBe("/dashboard");
    expect(callbackLanding("/auth/callback?x=1", roles)).toBe("/dashboard");
  });
});

describe("SSO callback redirect — other roles with next=/profile", () => {
  it("redirects editor to /review", async () => {
    const roles = await fetchUserRoles(EDITOR_USER);
    expect(callbackLanding("/profile", roles)).toBe("/review");
  });

  it("keeps a plain user on /profile", async () => {
    const roles = await fetchUserRoles(PLAIN_USER);
    expect(callbackLanding("/profile", roles)).toBe("/profile");
  });
});

describe("landing helpers", () => {
  it("landingForRoles prioritises admin", () => {
    expect(landingForRoles(["editor", "admin", "artist"])).toBe("/dashboard");
  });

  it("safeInternalTarget allows internal paths only", () => {
    expect(safeInternalTarget("/dashboard")).toBe("/dashboard");
    expect(safeInternalTarget("//x")).toBe("");
    expect(safeInternalTarget("https://x")).toBe("");
    expect(safeInternalTarget("/auth/callback")).toBe("");
    expect(safeInternalTarget("")).toBe("");
  });
});
