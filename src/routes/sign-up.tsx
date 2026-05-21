import { SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({ component: SignUpPage });

function SignUpPage() {
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
