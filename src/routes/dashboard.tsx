import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AuthDebug } from "@/components/AuthDebug";
import { clerkConfigured } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  if (!clerkConfigured) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Clerk inte konfigurerat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SignedOut>
        <Navigate to="/sign-in" />
      </SignedOut>
      <SignedIn>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Du är inloggad med Clerk.</p>
        <AuthDebug />
      </SignedIn>
    </div>
  );
}
