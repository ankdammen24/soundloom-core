import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "./sign-in";

export const Route = createFileRoute("/sign-up")({ component: SignUpPage });

function SignUpPage() {
  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight">Account provisioning</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Catalogus Musicus accounts are managed in Microsoft Entra ID. Contact your administrator to be added
        to the workspace, then sign in with your Microsoft account.
      </p>
      <div className="mt-6">
        <Link
          to="/sign-in"
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
