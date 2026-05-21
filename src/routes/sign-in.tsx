import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { clerkConfigured } from "@/lib/auth";

export const Route = createFileRoute("/sign-in")({ component: SignInPage });

function SignInPage() {
  if (!clerkConfigured) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Clerk inte konfigurerat.
      </div>
    );
  }

  return (
    <div className="flex justify-center py-8">
      <SignedIn>
        <Navigate to="/dashboard" />
      </SignedIn>
      <SignedOut>
        <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
      </SignedOut>
    </div>
  );
}
