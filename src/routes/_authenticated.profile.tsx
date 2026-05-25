import { SignedIn, SignedOut, UserProfile } from "@clerk/clerk-react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { clerkConfigured } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

function ProfilePage() {
  if (!clerkConfigured) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Clerk inte konfigurerat.
      </div>
    );
  }

  return (
    <div className="flex justify-center py-8">
      <SignedOut>
        <Navigate to="/sign-in" />
      </SignedOut>
      <SignedIn>
        <UserProfile routing="hash" />
      </SignedIn>
    </div>
  );
}
