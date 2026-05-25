import { supabase } from "@/lib/supabase";

export function landingForRoles(roles: string[] | undefined) {
  if (!roles || roles.length === 0) return "/profile";
  if (roles.includes("admin")) return "/dashboard";
  if (roles.includes("editor")) return "/review";
  if (roles.includes("artist")) return "/uploads";
  return "/profile";
}

export function safeInternalTarget(target: string | null | undefined) {
  if (!target) return "";
  if (!target.startsWith("/") || target.startsWith("//")) return "";
  if (target.startsWith("/auth/callback")) return "";
  return target;
}

export function callbackLanding(next: string | null | undefined, roles: string[] | undefined) {
  const target = safeInternalTarget(next);
  return target && target !== "/profile" ? target : landingForRoles(roles);
}

export async function fetchUserRoles(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) return [];
    return (data ?? []).map((r) => String((r as { role: string }).role));
  } catch {
    return [];
  }
}