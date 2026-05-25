import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { LogOut, Mail, User as UserIcon, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/sign-in", search: { redirect: location.href } });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation("profile");
  const { user, logoutRedirect } = useAuth();
  const getProfile = useServerFn(getOrCreateMyProfile);
  const saveProfile = useServerFn(updateMyProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await getProfile();
      if (cancelled) return;
      const row = result.profile;
      setDisplayName(row.display_name ?? "");
      setAvatarUrl(row.avatar_url ?? "");
      setEmail(row.email ?? user?.email ?? "");
      setLoading(false);
    })().catch(() => {
      if (!cancelled) {
        setError(t("loadError"));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [getProfile, t, user?.email]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await saveProfile({
        data: {
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        },
      });
      setDisplayName(result.profile.display_name ?? "");
      setAvatarUrl(result.profile.avatar_url ?? "");
      setEmail(result.profile.email ?? email);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  const initial = (displayName || email || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-primary/15 text-primary">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-semibold">{initial}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">
              {displayName || user?.displayName || user?.email || t("account")}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {email || user?.email || "—"}
            </div>
            {user?.roles && user.roles.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {user.roles.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold">{t("details")}</h2>
          <p className="text-sm text-muted-foreground">{t("detailsDesc")}</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> …
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
                className="h-9 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">{t("emailReadonly")}</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="display_name" className="text-sm font-medium">
                {t("displayName")}
              </label>
              <input
                id="display_name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("displayNamePlaceholder")}
                maxLength={120}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="avatar_url" className="text-sm font-medium">
                {t("avatarUrl")}
              </label>
              <input
                id="avatar_url"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder={t("avatarUrlPlaceholder")}
                maxLength={2048}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" /> {error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" /> {t("saved")}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Btn type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
                {saving ? t("saving") : t("save")}
              </Btn>
              <Btn variant="outline" type="button" onClick={() => void logoutRedirect()}>
                <LogOut className="h-4 w-4" /> {t("signOut")}
              </Btn>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
