import { createFileRoute } from "@tanstack/react-router";
import { AuthShell, AuthForm } from "./sign-in";

export const Route = createFileRoute("/sign-up")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "",
  }),
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <AuthShell>
      <AuthForm initialMode="sign-up" />
    </AuthShell>
  );
}
