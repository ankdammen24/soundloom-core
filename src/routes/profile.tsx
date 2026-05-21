import { SignedIn, SignedOut, UserProfile } from "@clerk/clerk-react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
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
