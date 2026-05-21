import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({ component: SignInPage });

function SignInPage() {
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
