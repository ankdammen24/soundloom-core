import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { SUPPORTED_LANGS, type SupportedLang } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className, variant = "default" }: { className?: string; variant?: "default" | "compact" }) {
  const { i18n, t } = useTranslation("common");
  const current = (SUPPORTED_LANGS as readonly string[]).includes(i18n.language?.split("-")[0] ?? "")
    ? (i18n.language.split("-")[0] as SupportedLang)
    : "en";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const lng = e.target.value as SupportedLang;
    void i18n.changeLanguage(lng);
  }

  return (
    <label className={cn("inline-flex items-center gap-1.5 text-xs", className)} aria-label={t("language.label")}>
      <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />
      <select
        value={current}
        onChange={onChange}
        className={cn(
          "appearance-none rounded-md border border-border bg-background px-2 py-1 font-medium text-foreground outline-none focus:border-ring",
          variant === "compact" && "px-1.5 py-0.5",
        )}
      >
        {SUPPORTED_LANGS.map((lng) => (
          <option key={lng} value={lng}>
            {t(`language.short.${lng}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
