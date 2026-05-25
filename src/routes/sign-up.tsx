import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthShell } from "./sign-in";

export const Route = createFileRoute("/sign-up")({ component: SignUpPage });

function SignUpPage() {
  const { t } = useTranslation("auth");
  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight">{t("signUp.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("signUp.subtitle")}</p>
      <div className="mt-6">
        <Link
          to="/sign-in"
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("callback.backToSignIn")}
        </Link>
      </div>
    </AuthShell>
  );
}
