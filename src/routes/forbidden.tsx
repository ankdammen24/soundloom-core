import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/forbidden")({
  head: () => ({ meta: [{ title: "Access denied – Music Catalog" }] }),
  component: ForbiddenPage,
});

function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
      <h1 className="mt-4 text-2xl font-bold">Access denied</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You don't have the required role to view this page. If you think this is a mistake,
        contact an administrator.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/dashboard"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go to dashboard
        </Link>
        <Link
          to="/"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
