import { SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { clerkConfigured } from "@/lib/auth";

export const Route = createFileRoute("/sign-up")({ component: SignUpPage });

function SignUpPage() {
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
        <SignUp fallbackRedirectUrl="/dashboard" signInUrl="/sign-in" />
      </SignedOut>
    </div>
  );
}
